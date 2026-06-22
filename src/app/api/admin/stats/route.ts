import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyVisitor from '@/models/DailyVisitor';
import User from '@/models/User';
import Story from '@/models/Story';
import Rating from '@/models/Rating';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getUserFromSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await dbConnect();

    // 1. User metrics
    const totalUsers = await User.countDocuments({});
    const adminUsersCount = await User.countDocuments({ role: 'admin' });

    // 2. Story metrics
    const approvedStoriesCount = await Story.countDocuments({ approved: true });
    const pendingStoriesCount = await Story.countDocuments({ approved: false });

    // 3. Review metrics
    const totalReviews = await Rating.countDocuments({});

    // 4. Traffic logs - Last 7 days
    const trafficDocs = await DailyVisitor.find({})
      .sort({ date: -1 })
      .limit(7);

    // Map and reverse so they are ordered chronologically (oldest -> newest/today)
    const trafficHistory = trafficDocs
      .map((doc) => ({
        date: doc.date,
        visitors: doc.uniqueIps.length,
      }))
      .reverse();

    // Fill in today if no entry exists yet
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasToday = trafficHistory.some((t) => t.date === todayStr);
    
    if (!hasToday) {
      trafficHistory.push({
        date: todayStr,
        visitors: 0,
      });
    }

    return NextResponse.json({
      metrics: {
        totalUsers,
        adminUsers: adminUsersCount,
        approvedStories: approvedStoriesCount,
        pendingStories: pendingStoriesCount,
        totalReviews,
      },
      traffic: trafficHistory,
    });
  } catch (error: unknown) {
    console.error('Fetch admin stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve admin stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
