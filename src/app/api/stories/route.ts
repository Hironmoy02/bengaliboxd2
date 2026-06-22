import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import Settings from '@/models/Settings';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';
import { DEFAULT_GENRE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, YOUTUBE_THUMBNAIL } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const channel = searchParams.get('channel') || '';
    const genre = searchParams.get('genre') || '';
    const writer = searchParams.get('writer') || '';
    const year = searchParams.get('year') || '';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const status = searchParams.get('status') || 'approved';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10)));

    const user = await getUserFromSession();

    const filter: Record<string, unknown> = {};

    if (status === 'pending' && user && user.role === 'admin') {
      filter.approved = false;
    } else if (status === 'all' && user && user.role === 'admin') {
      // Show all
    } else {
      filter.approved = true;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { narrator: { $regex: escapedSearch, $options: 'i' } },
        { channel: { $regex: escapedSearch, $options: 'i' } },
        { writer: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    if (channel && channel !== 'All') {
      filter.channel = channel;
    }

    if (genre && genre !== 'All') {
      filter.genre = genre;
    }

    if (writer && writer !== 'All') {
      filter.writer = writer;
    }

    if (year && year !== 'All') {
      filter.yearPublished = parseInt(year, 10);
    }

    let sort: Record<string, 1 | -1> = {};
    if (sortBy === 'newest') {
      sort = { createdAt: -1 };
    } else if (sortBy === 'reviews') {
      sort = { ratingsCount: -1, averageRating: -1 };
    } else {
      sort = { averageRating: -1, ratingsCount: -1 };
    }

    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find(filter).sort(sort).populate('addedBy', 'username').skip(skip).limit(limit),
      Story.countDocuments(filter),
    ]);

    return NextResponse.json({
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Fetch stories error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await dbConnect();

    if (user.role !== 'admin') {
      const settings = await Settings.getSettings();
      if (!settings.allowUserSubmissions) {
        return NextResponse.json(
          { error: 'Story submissions by contributors are currently disabled by the administrator.' },
          { status: 403 }
        );
      }
    }

    const { title, channel, youtubeUrl, narrator, genre, writer, description, thumbnailUrl, yearPublished } = await request.json();

    if (!title || !channel || !youtubeUrl || !narrator) {
      return NextResponse.json(
        { error: 'Title, Channel, YouTube URL, and Narrator are required' },
        { status: 400 }
      );
    }

    const youtubeId = getYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube video URL' }, { status: 400 });
    }

    const existingApprovedStory = await Story.findOne({ youtubeId, approved: true });
    if (existingApprovedStory) {
      return NextResponse.json(
        { error: 'This audio story is already in the catalog.' },
        { status: 400 }
      );
    }

    const existingPendingStory = await Story.findOne({ youtubeId, approved: false });
    if (existingPendingStory) {
      return NextResponse.json(
        { error: 'This audio story is already pending approval. You cannot submit the same story twice.' },
        { status: 400 }
      );
    }

    const finalThumbnailUrl = thumbnailUrl || YOUTUBE_THUMBNAIL(youtubeId);

    let finalYearPublished = yearPublished ? parseInt(yearPublished, 10) : undefined;
    if (!finalYearPublished) {
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const dateMatch = html.match(/"datePublished"\s*:\s*"(\d{4})/);
          if (dateMatch) finalYearPublished = parseInt(dateMatch[1], 10);
          else {
            const uploadMatch = html.match(/"uploadDate"\s*:\s*"(\d{4})/);
            if (uploadMatch) finalYearPublished = parseInt(uploadMatch[1], 10);
          }
        }
      } catch { /* ignore */ }
    }

    const approved = user.role === 'admin';

    const newStory = await Story.create({
      title: title.trim(),
      channel: channel.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      thumbnailUrl: finalThumbnailUrl,
      description: description ? description.trim() : '',
      narrator: narrator.trim(),
      genre: genre || DEFAULT_GENRE,
      writer: writer ? writer.trim() : '',
      yearPublished: finalYearPublished,
      addedBy: user.id as mongoose.Types.ObjectId,
      approved,
      averageRating: 0,
      ratingsCount: 0,
    });

    if (writer && writer.trim()) {
      const trimmed = writer.trim();
      const existing = await Writer.findOne({ name: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
      if (!existing) {
        await Writer.create({ name: trimmed });
      }
    }

    const successMessage = approved
      ? 'Story added successfully to the catalog!'
      : 'Story submitted successfully! It will appear on the lobby after admin approval.';

    return NextResponse.json({ message: successMessage, story: newStory }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add story' },
      { status: 500 }
    );
  }
}
