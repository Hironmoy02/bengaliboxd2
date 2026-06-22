import mongoose, { Schema } from 'mongoose';

const FeedbackSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['bug', 'feature', 'improvement', 'other'],
      default: 'improvement',
    },
    message: {
      type: String,
      required: [true, 'Please provide your feedback'],
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'implemented', 'dismissed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

try { mongoose.deleteModel('Feedback'); } catch {}
export default mongoose.model('Feedback', FeedbackSchema);
