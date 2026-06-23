import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listen from '@/models/Listen';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ listened: false });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
    }

    const listen = await Listen.findOne({ userId: user.id as string, storyId }).lean();

    return NextResponse.json({ listened: !!listen, listenedAt: listen?.listenedAt ?? listen?.createdAt ?? null });
  } catch (error: unknown) {
    console.error('Check listen error:', error);
    return NextResponse.json({ listened: false });
  }
}
