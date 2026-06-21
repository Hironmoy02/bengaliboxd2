import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

// POST: Approve a pending story
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    const story = await Story.findByIdAndUpdate(
      id,
      { approved: true },
      { new: true }
    );

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Story approved successfully!', story });
  } catch (error: any) {
    console.error('Approve story error:', error);
    return NextResponse.json({ error: 'Failed to approve story' }, { status: 500 });
  }
}

// DELETE: Reject/delete a pending story
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    const story = await Story.findByIdAndDelete(id);

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Story rejected and removed successfully.' });
  } catch (error: any) {
    console.error('Delete story error:', error);
    return NextResponse.json({ error: 'Failed to remove story' }, { status: 500 });
  }
}
