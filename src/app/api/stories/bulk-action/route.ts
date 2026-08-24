import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import BlockedVideo from '@/models/BlockedVideo';
import { getUserFromSession } from '@/lib/auth';

// POST /api/stories/bulk-action
// Body: { action: 'approve' | 'delete', ids: string[] }
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids } = body as { action: 'approve' | 'delete'; ids: string[] };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Missing action or ids' }, { status: 400 });
    }

    if (!['approve', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await dbConnect();

    // Explicitly cast string IDs → ObjectId so Mongoose matches _id correctly
    const objectIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'No valid story IDs provided' }, { status: 400 });
    }

    if (action === 'approve') {
      const result = await Story.updateMany(
        { _id: { $in: objectIds }, approved: false },
        { $set: { approved: true } }
      );
      return NextResponse.json({
        message: `Approved ${result.modifiedCount} ${result.modifiedCount === 1 ? 'story' : 'stories'} successfully.`,
        modifiedCount: result.modifiedCount,
      });
    }

    if (action === 'delete') {
      // Find first to collect youtubeIds for the blocklist
      const stories = await Story.find({
        _id: { $in: objectIds },
        approved: false, // safety: never bulk-delete approved stories
      }).lean();

      const youtubeIds = stories
        .map((s: { youtubeId?: string }) => s.youtubeId)
        .filter(Boolean) as string[];

      // Delete from DB
      const result = await Story.deleteMany({
        _id: { $in: objectIds },
        approved: false,
      });

      // Permanently block these youtubeIds so the cron never re-imports them
      if (youtubeIds.length > 0) {
        const ops = youtubeIds.map((yid) => ({
          updateOne: {
            filter: { youtubeId: yid },
            update: { $set: { youtubeId: yid, reason: 'admin_rejected' } },
            upsert: true,
          },
        }));
        await BlockedVideo.bulkWrite(ops);
      }

      return NextResponse.json({
        message: `Deleted ${result.deletedCount} ${result.deletedCount === 1 ? 'story' : 'stories'} successfully.`,
        deletedCount: result.deletedCount,
      });
    }
  } catch (error: unknown) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
