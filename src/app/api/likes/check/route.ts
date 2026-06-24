import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Like from '@/models/Like';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ liked: false });
    }

    await dbConnect();
    const userId = user.id as string;
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
    }

    const like = await Like.findOne({ userId, storyId }).lean();
    return NextResponse.json({ liked: !!like });
  } catch {
    return NextResponse.json({ liked: false });
  }
}
