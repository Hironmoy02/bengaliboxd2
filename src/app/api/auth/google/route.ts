import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJWT } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { idToken, isMock, mockEmail, mockName } = body;

    const rl = checkRateLimit('google-auth', 20, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many authentication attempts. Please try again later.' }, { status: 429 });
    }

    let email = '';
    let name = '';

    // Standard Client ID check (configured in env)
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (isMock) {
      // Mock Sandbox Login for Local Dev
      email = (mockEmail || 'hiru@bengaliboxd.com').trim().toLowerCase();
      name = (mockName || 'Hironmoy').trim();
    } else {
      if (!idToken) {
        return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 });
      }

      // Verify the token by calling Google's Tokeninfo endpoint
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!googleRes.ok) {
        return NextResponse.json({ error: 'Invalid Google ID token' }, { status: 400 });
      }

      const payload = await googleRes.json();

      // Verify Audience (Aud) matches Google Client ID if set
      if (googleClientId && payload.aud !== googleClientId) {
        return NextResponse.json({ error: 'Token audience mismatch' }, { status: 400 });
      }

      email = payload.email.trim().toLowerCase();
      name = payload.name || payload.given_name || 'Google User';
    }

    if (!email) {
      return NextResponse.json({ error: 'Email not provided by Google' }, { status: 400 });
    }

    // Find user by email
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, register them
      // Create a unique username based on Google Name or email prefix
      let baseUsername = name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      }
      if (baseUsername.length < 3) {
        baseUsername = `user_${Math.floor(100 + Math.random() * 900)}`;
      }

      // Ensure username uniqueness
      let finalUsername = baseUsername;
      let suffix = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}${suffix}`;
        suffix++;
      }

      // Generate a random password (since they login with Google)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Check admin status: first user is always admin; others via ADMIN_EMAILS env var
      const isFirstUser = (await User.countDocuments({})) === 0;
      const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const isAdmin = isFirstUser || adminEmails.includes(email);

      user = await User.create({
        username: finalUsername,
        email,
        password: hashedPassword,
        role: isAdmin ? 'admin' : 'user',
        bio: '',
        favoriteStories: [],
      });
    }

    // Sign JWT session token
    const jwtPayload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const token = await signJWT(jwtPayload);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Google login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during Google sign-in' },
      { status: 500 }
    );
  }
}
