import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import DailyVisitor from '@/models/DailyVisitor';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Extract and hash IP Address to respect privacy
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

    // 2. Get today's date string (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);

    // 3. Upsert today's visitor record
    // Using $addToSet to add the hashed IP if it doesn't already exist
    const visitorLog = await DailyVisitor.findOneAndUpdate(
      { date: today },
      { $addToSet: { uniqueIps: hashedIp } },
      { new: true, upsert: true }
    );

    // 4. Gather high-level stats for instant reporting
    const todayVisitorsCount = visitorLog.uniqueIps.length;
    const totalActiveUsers = await User.countDocuments({});

    return NextResponse.json({
      success: true,
      stats: {
        todayVisitors: todayVisitorsCount,
        activeUsers: totalActiveUsers,
      },
    });
  } catch (error: any) {
    console.error('Visitor logging error:', error);
    return NextResponse.json({ error: 'Failed to log visit' }, { status: 500 });
  }
}
