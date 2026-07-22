import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Writer from '@/models/Writer';
import { getUserFromSession } from '@/lib/auth';

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const Story = (await import('@/models/Story')).default;
    const activeWriters = await Story.distinct('writer', { approved: { $ne: false }, writer: { $exists: true, $ne: '' } });

    const filter: Record<string, unknown> = {
      name: { $in: activeWriters.map((w: string) => new RegExp(`^${escapeRegex(w.trim())}$`, 'i')) }
    };
    if (search) {
      filter.name = {
        $and: [
          filter.name,
          { $regex: escapeRegex(search), $options: 'i' }
        ]
      };
    }

    const writers = await Writer.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json({ writers });
  } catch (error: unknown) {
    console.error('Fetch writers error:', error);
    return NextResponse.json({ error: 'Failed to retrieve writers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Writer name is required' }, { status: 400 });
    }

    const trimmed = name.trim();
    const existing = await Writer.findOne({ name: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' } });
    if (existing) {
      return NextResponse.json({ message: 'Writer already exists', writer: existing });
    }

    const writer = await Writer.create({ name: trimmed });
    return NextResponse.json({ message: 'Writer added', writer }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create writer error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to add writer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Writer ID is required' }, { status: 400 });
    }

    await Writer.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Writer deleted' });
  } catch (error: unknown) {
    console.error('Delete writer error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete writer' }, { status: 500 });
  }
}