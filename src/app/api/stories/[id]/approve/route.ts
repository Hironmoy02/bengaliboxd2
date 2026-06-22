import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

// POST: Approve a pending story
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid Story ID format' },
        { status: 400 }
      );
    }

    const story = await Story.findById(new mongoose.Types.ObjectId(id));

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.approved) {
      return NextResponse.json(
        { error: 'Story is already approved' },
        { status: 400 }
      );
    }

    story.approved = true;
    await story.save();

    return NextResponse.json({
      message: 'Story approved successfully!',
      story,
    });
  } catch (error: unknown) {
    console.error('Approve story error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to approve story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Reject/delete a pending story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid Story ID format' },
        { status: 400 }
      );
    }

    const story = await Story.findByIdAndDelete(
      new mongoose.Types.ObjectId(id)
    );

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Story rejected and removed successfully.',
    });
  } catch (error: unknown) {
    console.error('Delete story error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to remove story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
