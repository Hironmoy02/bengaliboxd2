import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import Settings from '@/models/Settings';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';
import { DEFAULT_GENRE, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, YOUTUBE_THUMBNAIL, CHANNELS } from '@/lib/constants';
import { toSearchable } from '@/lib/transliterate';

function calculateRelevance(story: any, query: string, searchableQuery: string): number {
  const q = query.toLowerCase().trim();
  const sq = searchableQuery.toLowerCase().trim();
  if (!q) return 0;

  const title = (story.title || '').toLowerCase();
  const titleSearch = (story.titleSearch || '').toLowerCase();
  const narrator = (story.narrator || '').toLowerCase();
  const writer = (story.writer || '').toLowerCase();
  const genre = (story.genre || '').toLowerCase();
  const channel = (story.channel || '').toLowerCase();

  let score = 0;

  // Exact Title starts-with is highest priority
  if (title.startsWith(q)) {
    score += 1000;
  } else if (titleSearch.startsWith(sq)) {
    score += 900;
  }
  
  // Vowel-normalized starts-with (for o/a interchangeable search, e.g. "op" -> "ap")
  const normSq = sq.replace(/[oa]/g, 'a');
  const normTitleSearch = titleSearch.replace(/[oa]/g, 'a');
  if (normTitleSearch.startsWith(normSq)) {
    score += 800;
  }
  // Exact Title contains
  else if (title.includes(q)) {
    score += 500;
  } else if (titleSearch.includes(sq)) {
    score += 400;
  }
  // Vowel-normalized contains
  else if (normTitleSearch.includes(normSq)) {
    score += 300;
  }

  // Narrator / Writer starts with
  if (narrator.startsWith(q) || writer.startsWith(q)) {
    score += 200;
  }
  // Narrator / Writer contains
  else if (narrator.includes(q) || writer.includes(q)) {
    score += 100;
  }

  // Channel starts with / contains
  if (channel.startsWith(q)) {
    score += 50;
  } else if (channel.includes(q)) {
    score += 20;
  }

  // Genre contains
  if (genre.includes(q)) {
    score += 10;
  }

  return score;
}

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

    let searchableQuery = '';
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchableQuery = toSearchable(search);
      const escapedSearchable = searchableQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Support interchangeability of vowel representations (a and o) in Bengali searches
      const tolerantPattern = escapedSearchable.replace(/[oa]/gi, '[oa]');

      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { titleSearch: { $regex: escapedSearchable, $options: 'i' } },
        { titleSearch: { $regex: tolerantPattern, $options: 'i' } },
        { narrator: { $regex: escapedSearch, $options: 'i' } },
        { channel: { $regex: escapedSearch, $options: 'i' } },
        { writer: { $regex: escapedSearch, $options: 'i' } },
        { genre: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $regex: escapedSearch, $options: 'i' } },
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

    const skip = (page - 1) * limit;

    if (search) {
      // If searching, fetch a larger pool to ensure we capture all high-relevance matches
      const searchLimit = 200;
      const [allMatchingStories, total] = await Promise.all([
        Story.find(filter).populate('addedBy', 'username').limit(searchLimit),
        Story.countDocuments(filter)
      ]);

      // Calculate relevance score and sort
      const scored = allMatchingStories.map(story => ({
        story,
        score: calculateRelevance(story, search, searchableQuery)
      }));

      // Sort by relevance score descending, then by averageRating/ratingsCount descending
      scored.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const ratingA = a.story.averageRating || 0;
        const ratingB = b.story.averageRating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.story.ratingsCount || 0) - (a.story.ratingsCount || 0);
      });

      const sortedStories = scored.map(item => item.story);
      const paginatedStories = sortedStories.slice(skip, skip + limit);

      return NextResponse.json({
        stories: paginatedStories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    let sort: Record<string, 1 | -1> = {};
    if (sortBy === 'newest') {
      sort = { createdAt: -1 };
    } else if (sortBy === 'reviews') {
      sort = { ratingsCount: -1, averageRating: -1 };
    } else {
      sort = { averageRating: -1, ratingsCount: -1 };
    }

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

    const { title, channel, youtubeUrl, narrator, genre, writer, description, thumbnailUrl, yearPublished, duration, tags } = await request.json();

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

    const allowedChannels = CHANNELS.filter((ch) => ch !== 'Other Bengali Channels');
    if (!allowedChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Stories can only be added from: ${allowedChannels.join(', ')}.` },
        { status: 400 }
      );
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
      titleSearch: toSearchable(title.trim()),
      yearPublished: finalYearPublished,
      duration: duration ? parseInt(String(duration), 10) : undefined,
      tags: Array.isArray(tags) ? tags.filter((t: string) => typeof t === 'string' && t.trim()).map((t: string) => t.trim()).slice(0, 10) : [],
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
