import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';
import { matchYouTubeChannel } from '@/lib/constants';
import { fetchYouTubeMeta } from '@/lib/youtube-meta';

export async function GET(request: NextRequest) {
  try {
    // Restrict this to logged in users to avoid abuse
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL query parameter is required' }, { status: 400 });
    }

    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);

    if (!res.ok) {
      // Sometimes oembed fails if video is private or doesn't exist
      return NextResponse.json(
        { error: 'Could not fetch details. Please make sure the video is public.' },
        { status: 400 }
      );
    }

    const data = await res.json();

    const matchedChannel = matchYouTubeChannel(data.author_name || '');
    if (!matchedChannel) {
      return NextResponse.json(
        { error: `This video is from "${data.author_name}" which is not an allowed channel. Stories can only be added from Sunday Suspense, Goppo Mirer Thek, Midnight Horror Station, or Kahon.` },
        { status: 400 }
      );
    }

    let yearPublished: number | undefined;
    let duration: number | undefined;
    try {
      const meta = await fetchYouTubeMeta(videoId);
      if (meta.year) yearPublished = meta.year;
      if (meta.duration) duration = meta.duration;
    } catch { /* ignore page fetch errors */ }

    // Fallback: Check if the video title contains a 4-digit year (between 2000 and current year)
    if (!yearPublished && data.title) {
      const yearMatch = data.title.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        const y = parseInt(yearMatch[1], 10);
        if (y >= 2000 && y <= new Date().getFullYear()) {
          yearPublished = y;
        }
      }
    }

    return NextResponse.json({
      youtubeId: videoId,
      title: data.title || '',
      channel: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: `Uploaded by ${data.author_name || 'YouTube channel'}.`,
      yearPublished,
      duration,
    });
  } catch (error: unknown) {
    console.error('YouTube fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube details' }, { status: 500 });
  }
}
