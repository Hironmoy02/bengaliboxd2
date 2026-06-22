import mongoose, { Schema } from 'mongoose';

const WriterSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a writer name'],
      trim: true,
    },
  },
  { timestamps: true }
);

WriterSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

try { mongoose.deleteModel('Writer'); } catch {}
export default mongoose.model('Writer', WriterSchema);