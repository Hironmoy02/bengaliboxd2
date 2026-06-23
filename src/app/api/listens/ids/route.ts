import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listen from '@/models/Listen';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ listenIds: [] });
    }

    await dbConnect();
    const listens = await Listen.find({ userId: user.id as string }).select('storyId').lean();
    const listenIds = listens.map((l) => l.storyId.toString());

    return NextResponse.json({ listenIds });
  } catch (error: unknown) {
    console.error('Fetch listen IDs error:', error);
    return NextResponse.json({ listenIds: [] });
  }
}
