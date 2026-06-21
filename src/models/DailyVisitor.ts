import mongoose, { Schema } from 'mongoose';

const DailyVisitorSchema = new Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true, // e.g., '2026-06-21'
      index: true,
    },
    uniqueIps: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.DailyVisitor || mongoose.model('DailyVisitor', DailyVisitorSchema);
