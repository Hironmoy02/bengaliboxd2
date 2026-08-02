import mongoose, { Schema } from 'mongoose';

const CollectionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a collection name'],
      trim: true,
      maxlength: [100, 'Collection name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    gradient: {
      type: String,
      default: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    storyIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Story',
      default: [],
    },
  },
  { timestamps: true }
);

try { mongoose.deleteModel('Collection'); } catch {}
export default mongoose.model('Collection', CollectionSchema);
