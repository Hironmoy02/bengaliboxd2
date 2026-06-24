import mongoose, { Schema } from 'mongoose';

const LikeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storyId: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index so a user can only like a story once
LikeSchema.index({ userId: 1, storyId: 1 }, { unique: true });

try { mongoose.deleteModel('Like'); } catch {}
export default mongoose.model('Like', LikeSchema);
