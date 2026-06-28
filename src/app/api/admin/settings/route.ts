import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { getUserFromSession } from '@/lib/auth';

// GET: Retrieve current settings (admin only)
export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const settings = await Settings.getSettings();

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error('Fetch settings error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await request.json();

    const settings = await Settings.findOneAndUpdate(
      {},
      typeof body.allowUserSubmissions === 'boolean'
        ? { $set: { allowUserSubmissions: body.allowUserSubmissions } }
        : {},
      { new: true, runValidators: true }
    );

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error: unknown) {
    console.error('Update settings error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
