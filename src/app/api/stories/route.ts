import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const channel = searchParams.get('channel') || '';
    const genre = searchParams.get('genre') || '';
    const sortBy = searchParams.get('sortBy') || 'rating'; // rating, reviews, newest
    const status = searchParams.get('status') || 'approved'; // approved, pending, all

    const user = await getUserFromSession();

    // Build query filter
    const filter: any = {};

    if (status === 'pending' && user && user.role === 'admin') {
      filter.approved = false;
    } else if (status === 'all' && user && user.role === 'admin') {
      // Show all (no filter on approved)
    } else {
      // Standard users only see approved stories
      filter.approved = true;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { narrator: { $regex: search, $options: 'i' } },
        { channel: { $regex: search, $options: 'i' } },
      ];
    }

    if (channel && channel !== 'All') {
      filter.channel = channel;
    }

    if (genre && genre !== 'All') {
      filter.genre = genre;
    }

    // Build sort options
    let sort: any = {};
    if (sortBy === 'newest') {
      sort = { createdAt: -1 };
    } else if (sortBy === 'reviews') {
      sort = { ratingsCount: -1, averageRating: -1 };
    } else {
      // Default: sort by average rating descending
      sort = { averageRating: -1, ratingsCount: -1 };
    }

    const stories = await Story.find(filter).sort(sort).populate('addedBy', 'username');
    return NextResponse.json({ stories });
  } catch (error: any) {
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
    const { title, channel, youtubeUrl, narrator, genre, description, thumbnailUrl } = await request.json();

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

    // Check if story with this YouTube ID already exists
    const existingStory = await Story.findOne({ youtubeId });
    if (existingStory) {
      return NextResponse.json(
        { error: 'This audio story is already added to the system.' },
        { status: 400 }
      );
    }

    const finalThumbnailUrl = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    const approved = user.role === 'admin';

    const newStory = await Story.create({
      title: title.trim(),
      channel: channel.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      thumbnailUrl: finalThumbnailUrl,
      description: description ? description.trim() : '',
      narrator: narrator.trim(),
      genre: genre || 'Horror',
      addedBy: user.id,
      approved,
      averageRating: 0,
      ratingsCount: 0,
    });

    const successMessage = approved 
      ? 'Story added successfully to the catalog!' 
      : 'Story submitted successfully! It will appear on the lobby after admin approval.';

    return NextResponse.json({ message: successMessage, story: newStory }, { status: 201 });
  } catch (error: any) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add story' },
      { status: 500 }
    );
  }
}
