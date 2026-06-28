import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

const EmailOTPSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'login'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

EmailOTPSchema.index({ email: 1, purpose: 1 });
EmailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

try { mongoose.deleteModel('EmailOTP'); } catch {}
export default mongoose.model('EmailOTP', EmailOTPSchema);
