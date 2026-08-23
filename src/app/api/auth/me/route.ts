import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { processUserGamificationAction } from '@/lib/gamification';

export async function GET() {
  const user = await getUserFromSession();
  if (user?.id) {
    await processUserGamificationAction(user.id as string, 'LOGIN');
  }
  return NextResponse.json({ user });
}
