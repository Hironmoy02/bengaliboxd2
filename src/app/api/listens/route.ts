import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Listen from '@/models/Listen';
import Story from '@/models/Story';
import Rating from '@/models/Rating';
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
    
    const ratingFilter = searchParams.get('rating') || 'All';
    const sortBy = searchParams.get('sortBy') || 'newest';

    // 1. Fetch user's ratings to build a map of storyId -> ratingValue
    const ratings = await Rating.find({ userId }).select('storyId ratingValue').lean();
    const ratingMap = new Map(ratings.map((r) => [r.storyId.toString(), r.ratingValue]));

    // 2. Fetch all listens for this user
    const listens = await Listen.find({ userId })
      .populate({
        path: 'storyId',
        select: 'title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount yearPublished youtubeUrl approved createdAt duration',
      })
      .lean();

    // 3. Map to stories, adding user's own rating
    let stories = listens
      .filter((l) => l.storyId)
      .map((l) => {
        const storyDoc = l.storyId as unknown as Record<string, unknown>;
        const storyIdStr = String(storyDoc._id);
        const userRating = ratingMap.get(storyIdStr) || 0;
        return {
          ...storyDoc,
          listenedAt: l.listenedAt ?? l.createdAt,
          userRating,
        };
      }) as Array<Record<string, unknown> & { userRating: number; listenedAt: Date | string }>;

    // 4. Filter by user rating if requested
    if (ratingFilter !== 'All') {
      if (ratingFilter === 'unrated') {
        stories = stories.filter((s) => s.userRating === 0);
      } else {
        const val = Number(ratingFilter);
        stories = stories.filter((s) => s.userRating === val);
      }
    }

    // 5. Sort by requested option
    if (sortBy === 'newest') {
      stories.sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
    } else if (sortBy === 'oldest') {
      stories.sort((a, b) => new Date(a.listenedAt).getTime() - new Date(b.listenedAt).getTime());
    } else if (sortBy === 'rating-desc') {
      stories.sort((a, b) => b.userRating - a.userRating);
    } else if (sortBy === 'rating-asc') {
      stories.sort((a, b) => {
        if (a.userRating === 0 && b.userRating !== 0) return 1;
        if (b.userRating === 0 && a.userRating !== 0) return -1;
        return a.userRating - b.userRating;
      });
    }

    // 6. Paginate
    const total = stories.length;
    const paginatedStories = stories.slice(skip, skip + limit);

    return NextResponse.json({
      listens: paginatedStories,
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
