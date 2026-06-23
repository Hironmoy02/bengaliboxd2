import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';
import { matchYouTubeChannel } from '@/lib/constants';

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
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const dateMatch = html.match(/"datePublished"\s*:\s*"(\d{4})/);
        if (dateMatch) {
          yearPublished = parseInt(dateMatch[1], 10);
        } else {
          const uploadMatch = html.match(/"uploadDate"\s*:\s*"(\d{4})/);
          if (uploadMatch) yearPublished = parseInt(uploadMatch[1], 10);
        }
      }
    } catch { /* ignore page fetch errors */ }

    return NextResponse.json({
      youtubeId: videoId,
      title: data.title || '',
      channel: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: `Uploaded by ${data.author_name || 'YouTube channel'}.`,
      yearPublished,
    });
  } catch (error: unknown) {
    console.error('YouTube fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube details' }, { status: 500 });
  }
}
