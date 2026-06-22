import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Bookmark from '@/models/Bookmark';
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

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'title') sort = { createdAt: -1 };
    if (sortBy === 'rating') sort = { createdAt: -1 };

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ userId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'storyId',
          select: 'title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount yearPublished youtubeUrl approved createdAt',
        })
        .lean(),
      Bookmark.countDocuments({ userId }),
    ]);

    let stories = bookmarks
      .filter((b) => b.storyId)
      .map((b) => ({
        ...(b.storyId as unknown as Record<string, unknown>),
        bookmarkedAt: b.createdAt,
      })) as Array<Record<string, unknown>>;

    if (sortBy === 'title') {
      stories.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    } else if (sortBy === 'rating') {
      stories.sort((a, b) => Number(b.averageRating) - Number(a.averageRating));
    }

    return NextResponse.json({
      bookmarks: stories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error('Fetch bookmarks error:', error);
    return NextResponse.json({ error: 'Failed to retrieve bookmarks' }, { status: 500 });
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

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const existing = await Bookmark.findOne({ userId, storyId });
    if (existing) {
      return NextResponse.json({ error: 'Story already bookmarked' }, { status: 409 });
    }

    const bookmark = await Bookmark.create({ userId, storyId });
    return NextResponse.json({ message: 'Story bookmarked', bookmark }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create bookmark error:', error);
    return NextResponse.json({ error: 'Failed to bookmark story' }, { status: 500 });
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

    const bookmark = await Bookmark.findOneAndDelete({ userId, storyId });
    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bookmark removed' });
  } catch (error: unknown) {
    console.error('Delete bookmark error:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }
}
