import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Story from '@/models/Story';
import Rating from '@/models/Rating';
import { getUserFromSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = user.id as string;
    const userDoc = await User.findById(userId).select('username email role createdAt').lean();
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [stories, ratings] = await Promise.all([
      Story.find({ addedBy: userId }).sort({ createdAt: -1 }).lean(),
      Rating.find({ userId: userId }).populate('storyId', 'title youtubeId narrator writer channel yearPublished averageRating').sort({ updatedAt: -1 }).lean(),
    ]);

    return NextResponse.json({ user: userDoc, stories, ratings });
  } catch (error: unknown) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const userId = user.id as string;
    if (body.username) {
      const trimmed = body.username.trim();
      if (trimmed.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
      }
      const existing = await User.findOne({ username: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, _id: { $ne: userId } });
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    if (body.currentPassword && body.newPassword) {
      const userDoc = await User.findById(userId);
      if (!userDoc) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const isMatch = await bcrypt.compare(body.currentPassword, userDoc.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(body.newPassword, salt);
    }

    const updates: Record<string, string> = {};
    if (body.username) updates.username = body.username.trim();
    if (body.password) updates.password = body.password;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('username email role createdAt');
    return NextResponse.json({ message: 'Profile updated successfully', user: updated });
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update profile' }, { status: 500 });
  }
}
