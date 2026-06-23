import mongoose, { Schema } from 'mongoose';

const ListenSchema = new Schema(
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
    listenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ListenSchema.index({ userId: 1, storyId: 1 }, { unique: true });
ListenSchema.index({ userId: 1, listenedAt: -1 });

try { mongoose.deleteModel('Listen'); } catch {}
export default mongoose.model('Listen', ListenSchema);
