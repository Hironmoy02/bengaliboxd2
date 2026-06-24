import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Listen from '@/models/Listen';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = user.id as string;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [listens, total] = await Promise.all([
      Listen.find({ userId })
        .sort({ listenedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'storyId',
          select: 'title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount yearPublished youtubeUrl approved createdAt duration',
        })
        .lean(),
      Listen.countDocuments({ userId }),
    ]);

    const stories = listens
      .filter((l) => l.storyId)
      .map((l) => ({
        ...(l.storyId as unknown as Record<string, unknown>),
        listenedAt: l.listenedAt ?? l.createdAt,
      })) as Array<Record<string, unknown>>;

    return NextResponse.json({
      listens: stories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error('Fetch listens error:', error);
    return NextResponse.json({ error: 'Failed to retrieve listening history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await dbConnect();
    const userId = user.id as string;
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const listen = await Listen.findOneAndUpdate(
      { userId: user.id as mongoose.Types.ObjectId, storyId: new mongoose.Types.ObjectId(storyId) },
      { listenedAt: new Date() },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'Story marked as listened', listen });
  } catch (error: unknown) {
    console.error('Create listen error:', error);
    return NextResponse.json({ error: 'Failed to mark story as listened' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = user.id as string;
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    const listen = await Listen.findOneAndDelete({ userId, storyId });
    if (!listen) {
      return NextResponse.json({ error: 'Listen record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Listen record removed' });
  } catch (error: unknown) {
    console.error('Delete listen error:', error);
    return NextResponse.json({ error: 'Failed to remove listen record' }, { status: 500 });
  }
}
