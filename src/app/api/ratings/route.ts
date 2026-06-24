import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import Story from '@/models/Story';
import Listen from '@/models/Listen';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await dbConnect();
    const { storyId, ratingValue, reviewText, narrationRating, atmosphereRating } = await request.json();

    if (!storyId || !ratingValue) {
      return NextResponse.json(
        { error: 'Story ID and star rating are required' },
        { status: 400 }
      );
    }

    const ratingVal = Number(ratingValue);
    if (isNaN(ratingVal) || ratingVal < 0.5 || ratingVal > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 0.5 and 5 (e.g. 3, 3.5, 4, 4.5)' },
        { status: 400 }
      );
    }

    // Snap to nearest 0.5
    const snappedRating = Math.round(ratingVal * 2) / 2;

    const snapHalf = (v: unknown) => {
      const n = Number(v);
      if (!n || n < 0.5 || n > 5) return undefined;
      return Math.round(n * 2) / 2;
    };
    const snappedNarration = snapHalf(narrationRating);
    const snappedAtmosphere = snapHalf(atmosphereRating);

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    // Check if story exists
    const storyExists = await Story.findById(storyId);
    if (!storyExists) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Upsert the rating
    const updateData: Record<string, unknown> = {
      ratingValue: snappedRating,
      reviewText: reviewText ? reviewText.trim() : '',
    };
    if (snappedNarration !== undefined) updateData.narrationRating = snappedNarration;
    if (snappedAtmosphere !== undefined) updateData.atmosphereRating = snappedAtmosphere;

    const rating = await Rating.findOneAndUpdate(
      { userId: user.id as mongoose.Types.ObjectId, storyId: new mongoose.Types.ObjectId(storyId) },
      updateData,
      { new: true, upsert: true }
    );

    // Recalculate average rating & ratings count for the story
    const stats = await Rating.aggregate([
      { $match: { storyId: new mongoose.Types.ObjectId(storyId) } },
      {
        $group: {
          _id: '$storyId',
          averageRating: { $avg: '$ratingValue' },
          ratingsCount: { $sum: 1 },
        },
      },
    ]);

    let averageRating = 0;
    let ratingsCount = 0;

    if (stats.length > 0) {
      // Round to 1 decimal place
      averageRating = Math.round(stats[0].averageRating * 10) / 10;
      ratingsCount = stats[0].ratingsCount;
    }

    await Story.findByIdAndUpdate(storyId, {
      averageRating,
      ratingsCount,
    });

    // Auto-create listen record when a rating is submitted
    await Listen.findOneAndUpdate(
      { userId: user.id as mongoose.Types.ObjectId, storyId: new mongoose.Types.ObjectId(storyId) },
      { listenedAt: new Date() },
      { upsert: true, new: true }
    ).catch(() => {});

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating,
      stats: { averageRating, ratingsCount },
    });
  } catch (error: unknown) {
    console.error('Submit rating error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit rating';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
