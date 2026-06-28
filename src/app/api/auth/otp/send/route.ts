import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import EmailOTP, { generateOTP } from '@/models/EmailOTP';
import { sendEmail } from '@/lib/email';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const OTP_EXPIRY_MINUTES = 10;

const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW);
  requestLog.set(key, timestamps);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) return true;
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, purpose = 'registration' } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    await EmailOTP.deleteMany({ email: normalizedEmail, purpose });

    const otp = generateOTP();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    await EmailOTP.create({
      email: normalizedEmail,
      otp: hashedOTP,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: 'Bengaliboxd - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff5e2b;">Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 0.9rem;">This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          <p style="color: #666; font-size: 0.9rem;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 0.8rem;">Bengaliboxd - The Bengali Audio Story Journal</p>
        </div>
      `,
    });

    if (!emailSent) {
      console.warn(`[DEV MODE] OTP for ${normalizedEmail}: ${otp}`);
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error: unknown) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
