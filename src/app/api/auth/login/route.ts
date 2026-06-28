import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJWT } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { emailOrUsername, password } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    const input = emailOrUsername.trim().toLowerCase();
    const rl = checkRateLimit(`login:${input}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(rl.retryAfterMs / 60000)} minutes.` },
        { status: 429 }
      );
    }

    // Escape regex special characters to prevent ReDoS/injection
    const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find user by email or exact username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: input },
        { username: { $regex: `^${escaped}$`, $options: 'i' } },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account is locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` },
        { status: 423 }
      );
    }

    // If lockout expired, reset attempts
    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        return NextResponse.json(
          { error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' },
          { status: 423 }
        );
      }
      await user.save();
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    // Successful login — reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Create JWT
    const payload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const token = await signJWT(payload);

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
