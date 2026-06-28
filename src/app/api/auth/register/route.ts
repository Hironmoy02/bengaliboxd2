import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import EmailOTP from '@/models/EmailOTP';
import { signJWT } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { username, email, password, verificationToken } = await request.json();

    if (!username || !email || !password || !verificationToken) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const rl = checkRateLimit(`register:${email.trim().toLowerCase()}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const otpRecord = await EmailOTP.findOne({
      email: normalizedEmail,
      purpose: 'registration',
      otp: hashedToken,
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Email verification required. Please verify your email first.' },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await EmailOTP.deleteMany({ email: normalizedEmail, purpose: 'registration' });
      return NextResponse.json(
        { error: 'Verification has expired. Please verify your email again.' },
        { status: 400 }
      );
    }

    await EmailOTP.deleteMany({ email: normalizedEmail, purpose: 'registration' });

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
    });

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminCount = await User.countDocuments({ role: 'admin' });
    const role = adminCount === 0 ? 'admin' : 'user';

    const newUser = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const payload = {
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      tokenVersion: 0,
    };
    const token = await signJWT(payload);

    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during registration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
