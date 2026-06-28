import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordReset, { generateResetToken, hashResetToken } from '@/models/PasswordReset';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    // Generate raw token (sent in email) and hash (stored in DB)
    const rawToken = generateResetToken();
    const hashedToken = hashResetToken(rawToken);

    // Save hashed token with 1 hour expiry
    await PasswordReset.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Build reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Bengaliboxd - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff5e2b;">Password Reset Request</h2>
          <p>Hi <strong>${user.username}</strong>,</p>
          <p>You requested a password reset for your Bengaliboxd account.</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #ff5e2b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <p style="color: #666; font-size: 0.9rem;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 0.8rem;">Bengaliboxd - The Bengali Audio Story Journal</p>
        </div>
      `,
    });

    if (!emailSent) {
      console.warn(`[DEV MODE] Password reset link for ${user.email}: ${resetUrl}`);
    }

    return NextResponse.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
