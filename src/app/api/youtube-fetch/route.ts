import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

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

    return NextResponse.json({
      youtubeId: videoId,
      title: data.title || '',
      channel: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: `Uploaded by ${data.author_name || 'YouTube channel'}.`,
    });
  } catch (error: any) {
    console.error('YouTube fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube details' }, { status: 500 });
  }
}
