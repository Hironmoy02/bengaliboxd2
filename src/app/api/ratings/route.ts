import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import Story from '@/models/Story';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await dbConnect();
    const { storyId, ratingValue, reviewText } = await request.json();

    if (!storyId || !ratingValue) {
      return NextResponse.json(
        { error: 'Story ID and star rating are required' },
        { status: 400 }
      );
    }

    const ratingVal = Number(ratingValue);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json(
        { error: 'Rating must be a whole number between 1 and 5' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'Invalid Story ID format' }, { status: 400 });
    }

    // Check if story exists
    const storyExists = await Story.findById(storyId);
    if (!storyExists) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Upsert the rating
    const rating = await Rating.findOneAndUpdate(
      { userId: user.id, storyId: new mongoose.Types.ObjectId(storyId) },
      {
        ratingValue: ratingVal,
        reviewText: reviewText ? reviewText.trim() : '',
      },
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

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating,
      stats: { averageRating, ratingsCount },
    });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
