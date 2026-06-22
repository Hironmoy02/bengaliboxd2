import mongoose, { Schema } from 'mongoose';

const StorySchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a story title'],
      trim: true,
    },
    channel: {
      type: String,
      required: [true, 'Please specify the YouTube channel'],
      trim: true,
    },
    youtubeUrl: {
      type: String,
      required: [true, 'Please provide a YouTube URL'],
      trim: true,
    },
    youtubeId: {
      type: String,
      required: [true, 'Please provide a YouTube Video ID'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    narrator: {
      type: String,
      required: [true, 'Please specify the narrator(s)'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Please specify the genre'],
      default: 'Horror',
      trim: true,
    },
    writer: {
      type: String,
      trim: true,
      default: '',
    },
    yearPublished: {
      type: Number,
      min: 1900,
      max: 2100,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

try { mongoose.deleteModel('Story'); } catch {}
export default mongoose.model('Story', StorySchema);
