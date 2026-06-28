import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Like from '@/models/Like';
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
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    
    const [likes, total] = await Promise.all([
      Like.find({ userId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'storyId',
          select: 'title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount yearPublished youtubeUrl approved createdAt',
        })
        .lean(),
      Like.countDocuments({ userId }),
    ]);

    const stories = likes
      .filter((l) => l.storyId)
      .map((l) => ({
        ...(l.storyId as unknown as Record<string, unknown>),
        likedAt: l.createdAt,
      })) as Array<Record<string, unknown>>;

    if (sortBy === 'title') {
      stories.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    } else if (sortBy === 'rating') {
      stories.sort((a, b) => Number(b.averageRating) - Number(a.averageRating));
    }

    return NextResponse.json({
      likes: stories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error('Fetch likes error:', error);
    return NextResponse.json({ error: 'Failed to retrieve liked stories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const existing = await Like.findOne({ userId, storyId });
    if (existing) {
      return NextResponse.json({ error: 'Story already liked' }, { status: 409 });
    }

    const like = await Like.create({ userId, storyId });
    return NextResponse.json({ message: 'Story liked', like }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create like error:', error);
    return NextResponse.json({ error: 'Failed to like story' }, { status: 500 });
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

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    const like = await Like.findOneAndDelete({ userId, storyId });
    if (!like) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Like removed' });
  } catch (error: unknown) {
    console.error('Delete like error:', error);
    return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
  }
}
