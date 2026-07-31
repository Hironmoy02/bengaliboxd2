import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getUserGamificationProfile } from '@/lib/gamification';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gamificationProfile = await getUserGamificationProfile(user.id as string);
    if (!gamificationProfile) {
      return NextResponse.json({ error: 'User gamification data not found' }, { status: 404 });
    }

    return NextResponse.json(gamificationProfile);
  } catch (error: unknown) {
    console.error('Fetch gamification profile error:', error);
    return NextResponse.json({ error: 'Failed to retrieve gamification details' }, { status: 500 });
  }
}
