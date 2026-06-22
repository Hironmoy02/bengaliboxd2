import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

const PasswordResetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

PasswordResetSchema.index({ userId: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

try { mongoose.deleteModel('PasswordReset'); } catch {}
export default mongoose.model('PasswordReset', PasswordResetSchema);
