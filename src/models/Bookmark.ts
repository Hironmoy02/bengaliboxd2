import mongoose, { Schema } from 'mongoose';

const BookmarkSchema = new Schema(
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

BookmarkSchema.index({ userId: 1, storyId: 1 }, { unique: true });

try { mongoose.deleteModel('Bookmark'); } catch {}
export default mongoose.model('Bookmark', BookmarkSchema);
