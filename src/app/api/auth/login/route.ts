import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJWT } from '@/lib/auth';

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

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: input },
        { username: { $regex: new RegExp(`^${input}$`, 'i') } },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    // Create JWT
    const payload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
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
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
