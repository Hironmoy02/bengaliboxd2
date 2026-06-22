import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordReset, { hashResetToken } from '@/models/PasswordReset';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Hash the raw token to compare with stored hash
    const hashedToken = hashResetToken(token);

    // Find the reset record
    const resetRecord = await PasswordReset.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash new password and update user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(resetRecord.userId, { password: hashedPassword });

    // Delete the reset token (and any others for this user)
    await PasswordReset.deleteMany({ userId: resetRecord.userId });

    return NextResponse.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
