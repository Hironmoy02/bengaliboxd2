import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  const user = await getUserFromSession();
  return NextResponse.json({ user });
}
