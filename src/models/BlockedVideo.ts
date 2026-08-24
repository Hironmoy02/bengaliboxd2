import mongoose, { Schema } from 'mongoose';

// Simple blocklist: when an admin rejects a pending story,
// we store the youtubeId here so the cron sync never re-imports it.
const BlockedVideoSchema = new Schema(
  {
    youtubeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      default: 'admin_rejected',
    },
  },
  { timestamps: true }
);

try { mongoose.deleteModel('BlockedVideo'); } catch {}
export default mongoose.model('BlockedVideo', BlockedVideoSchema);
