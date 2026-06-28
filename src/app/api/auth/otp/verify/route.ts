import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import EmailOTP from '@/models/EmailOTP';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, otp, purpose = 'registration' } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedOTP = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    const record = await EmailOTP.findOne({
      email: normalizedEmail,
      purpose,
    });

    if (!record) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (record.attempts >= 5) {
      await EmailOTP.deleteMany({ email: normalizedEmail, purpose });
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      await EmailOTP.deleteMany({ email: normalizedEmail, purpose });
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.otp !== hashedOTP) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    record.otp = hashedToken;
    record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await record.save();

    return NextResponse.json({
      message: 'Email verified successfully',
      verificationToken,
    });
  } catch (error: unknown) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
