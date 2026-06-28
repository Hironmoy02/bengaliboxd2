import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listen from '@/models/Listen';
import Rating from '@/models/Rating';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = user.id as string;

    const [listens, ratings] = await Promise.all([
      Listen.find({ userId })
        .populate({ path: 'storyId', select: 'genre writer narrator duration' })
        .lean(),
      Rating.find({ userId })
        .populate({ path: 'storyId', select: 'genre writer narrator' })
        .lean(),
    ]);

    const totalListened = listens.length;

    const totalSeconds = listens.reduce((sum, l) => {
      const dur = (l as unknown as { duration?: number }).duration || 0;
      return sum + dur;
    }, 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    const genreCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    const narratorCounts: Record<string, number> = {};

    listens.forEach((l) => {
      const story = l.storyId as unknown as { genre?: string; writer?: string; narrator?: string } | null;
      if (!story) return;
      if (story.genre) genreCounts[story.genre] = (genreCounts[story.genre] || 0) + 1;
      if (story.writer) authorCounts[story.writer] = (authorCounts[story.writer] || 0) + 1;
      if (story.narrator) {
        story.narrator.split(/,|&/).map((n: string) => n.trim()).filter(Boolean).forEach((n: string) => {
          narratorCounts[n] = (narratorCounts[n] || 0) + 1;
        });
      }
    });

    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topNarrator = Object.entries(narratorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return NextResponse.json({
      stats: {
        totalListened,
        totalHours,
        totalRatings: ratings.length,
        topGenre,
        topAuthor,
        topNarrator,
      },
    });
  } catch (error: unknown) {
    console.error('Fetch user stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
