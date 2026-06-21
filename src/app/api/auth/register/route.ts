import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
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

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if this is the first user registered in the system (auto-make them admin)
    const adminCount = await User.countDocuments({ role: 'admin' });
    const role = adminCount === 0 ? 'admin' : 'user';

    // Create user
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    // Create JWT
    const payload = {
      id: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
