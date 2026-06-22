import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Bookmark from '@/models/Bookmark';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ bookmarked: false });
    }

    await dbConnect();
    const userId = user.id as string;
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
    }

    const bookmark = await Bookmark.findOne({ userId, storyId }).lean();
    return NextResponse.json({ bookmarked: !!bookmark });
  } catch {
    return NextResponse.json({ bookmarked: false });
  }
}
