import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const story = await Story.findById(id).populate('addedBy', 'username');

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (!story.approved) {
      const user = await getUserFromSession();
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ story });
  } catch (error: unknown) {
    console.error('Fetch story by ID error:', error);
    return NextResponse.json({ error: 'Failed to retrieve story details' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const trimmedTitle = String(body.title).trim();
      updates.title = trimmedTitle;
      const { toSearchable } = await import('@/lib/transliterate');
      updates.titleSearch = toSearchable(trimmedTitle);
    }
    if (body.channel !== undefined) updates.channel = String(body.channel).trim();
    if (body.narrator !== undefined) updates.narrator = String(body.narrator).trim();
    if (body.genre !== undefined) updates.genre = String(body.genre).trim();
    if (body.writer !== undefined) updates.writer = String(body.writer).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.thumbnailUrl !== undefined) updates.thumbnailUrl = String(body.thumbnailUrl).trim();
    if (body.approved !== undefined) updates.approved = Boolean(body.approved);
    if (body.yearPublished !== undefined) {
      updates.yearPublished = body.yearPublished ? parseInt(String(body.yearPublished), 10) : undefined;
    }
    if (body.duration !== undefined) {
      updates.duration = body.duration ? parseInt(String(body.duration), 10) : undefined;
    }
    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags) ? body.tags.filter((t: string) => typeof t === 'string' && t.trim()).map((t: string) => t.trim()).slice(0, 10) : [];
    }
    if (body.youtubeUrl !== undefined) {
      const youtubeId = getYouTubeId(String(body.youtubeUrl));
      if (!youtubeId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      }
      updates.youtubeUrl = body.youtubeUrl.trim();
      updates.youtubeId = youtubeId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await Story.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    return NextResponse.json({ message: 'Story updated successfully', story: updated });
  } catch (error: unknown) {
    console.error('Update story error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update story' }, { status: 500 });
  }
}
