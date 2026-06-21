import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    const reviews = await Rating.find({ storyId: new mongoose.Types.ObjectId(id) })
      .populate('userId', 'username')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Failed to retrieve reviews' }, { status: 500 });
  }
}
