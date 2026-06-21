import mongoose, { Schema } from 'mongoose';

const RatingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the rating user'],
    },
    storyId: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: [true, 'Please specify the story being rated'],
    },
    ratingValue: {
      type: Number,
      required: [true, 'Please provide a rating value between 1 and 5'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Compound unique index so a user can only rate a specific story once
RatingSchema.index({ userId: 1, storyId: 1 }, { unique: true });

export default mongoose.models.Rating || mongoose.model('Rating', RatingSchema);
