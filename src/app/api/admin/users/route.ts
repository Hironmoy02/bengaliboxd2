import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getUserFromSession } from '@/lib/auth';

// GET: Retrieve list of all users (Admin only)
export async function GET() {
  try {
    const sessionUser = await getUserFromSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await dbConnect();
    // Return all users, sorted by registration date (newest first), omitting password
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Failed to retrieve users list' }, { status: 500 });
  }
}

// POST: Promote a user to Admin (Admin only)
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getUserFromSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await dbConnect();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: `User '${updatedUser.username}' successfully promoted to Admin!`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Promote user error:', error);
    return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 });
  }
}
