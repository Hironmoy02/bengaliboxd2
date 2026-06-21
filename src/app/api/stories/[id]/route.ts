import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const story = await Story.findById(id).populate('addedBy', 'username');

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ story });
  } catch (error: any) {
    console.error('Fetch story by ID error:', error);
    return NextResponse.json({ error: 'Failed to retrieve story details' }, { status: 500 });
  }
}
