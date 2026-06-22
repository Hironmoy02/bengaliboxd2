import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Bookmark from '@/models/Bookmark';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ bookmarkIds: [] });
    }

    await dbConnect();
    const userId = user.id as string;
    const bookmarks = await Bookmark.find({ userId }).select('storyId').lean();
    const bookmarkIds = bookmarks.map((b) => b.storyId.toString());
    return NextResponse.json({ bookmarkIds });
  } catch {
    return NextResponse.json({ bookmarkIds: [] });
  }
}
