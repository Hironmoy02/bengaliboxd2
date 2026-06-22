import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Feedback from '@/models/Feedback';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Feedback.countDocuments(filter),
    ]);

    return NextResponse.json({
      feedbacks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { category, message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    const userId = user.id as string;
    const feedback = await Feedback.create({
      userId: userId,
      category: category || 'improvement',
      message: message.trim(),
    });

    return NextResponse.json({ message: 'Feedback submitted successfully', feedback }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create feedback error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to submit feedback' }, { status: 500 });
  }
}
