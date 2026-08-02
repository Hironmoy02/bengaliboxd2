import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Collection from '@/models/Collection';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const collection = await Collection.findById(id).lean();
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const filter: Record<string, unknown> = { approved: true };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { narrator: { $regex: escapedSearch, $options: 'i' } },
        { writer: { $regex: escapedSearch, $options: 'i' } },
        { channel: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const stories = await Story.find(filter)
      .select('_id title channel narrator writer youtubeId thumbnailUrl averageRating ratingsCount duration')
      .limit(20)
      .lean();

    const collectionStoryIds = new Set((collection.storyIds || []).map((sid) => sid.toString()));

    const results = stories.map((story) => ({
      ...story,
      isInCollection: collectionStoryIds.has(story._id.toString()),
    }));

    return NextResponse.json({ stories: results });
  } catch (error: unknown) {
    console.error('Fetch collection stories error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const storyExists = await Story.findById(storyId).lean();
    if (!storyExists) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (!collection.storyIds.some((sid) => sid.toString() === storyId)) {
      collection.storyIds.push(storyId);
      await collection.save();
    }

    return NextResponse.json({ message: 'Story added to collection' });
  } catch (error: unknown) {
    console.error('Add story to collection error:', error);
    return NextResponse.json({ error: 'Failed to add story' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const { storyId } = await request.json();

    if (!storyId) {
      return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    collection.storyIds = collection.storyIds.filter((sid) => sid.toString() !== storyId);
    await collection.save();

    return NextResponse.json({ message: 'Story removed from collection' });
  } catch (error: unknown) {
    console.error('Remove story from collection error:', error);
    return NextResponse.json({ error: 'Failed to remove story' }, { status: 500 });
  }
}
