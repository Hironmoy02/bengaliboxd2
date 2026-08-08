import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import { fetchYouTubeMeta, extractNarrators, extractWriters } from '@/lib/youtube-meta';
import { getUserFromSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await dbConnect();

    const storiesToFix = await Story.find({
      $or: [
        { narrator: 'Unknown' },
        { narrator: '' },
        { narrator: { $exists: false } },
        { writer: 'Unknown' },
        { writer: '' },
        { writer: null },
        { writer: { $exists: false } },
      ],
    });

    let updatedCount = 0;

    for (const story of storiesToFix) {
      let videoDesc = story.description || '';
      let yearPublished = story.yearPublished;
      let duration = story.duration;

      try {
        const meta = await fetchYouTubeMeta(story.youtubeId);
        if (meta.description) videoDesc = meta.description;
        if (!yearPublished && meta.year) yearPublished = meta.year;
        if (!duration && meta.duration) duration = meta.duration;
      } catch {
        /* ignore fetch errors */
      }

      const detectedNarrator = extractNarrators(story.title || '', videoDesc, story.channel || '');
      const detectedWriter = extractWriters(story.title || '', videoDesc, story.channel || '');

      const updates: Record<string, unknown> = {};
      if (detectedNarrator && detectedNarrator !== story.narrator) {
        updates.narrator = detectedNarrator;
      }
      if (detectedWriter && detectedWriter !== story.writer) {
        updates.writer = detectedWriter;
      }
      if (videoDesc && videoDesc !== story.description) {
        updates.description = videoDesc.slice(0, 500);
      }
      if (yearPublished && yearPublished !== story.yearPublished) {
        updates.yearPublished = yearPublished;
      }
      if (duration && duration !== story.duration) {
        updates.duration = duration;
      }

      if (Object.keys(updates).length > 0) {
        await Story.findByIdAndUpdate(story._id, updates);
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Processed ${storiesToFix.length} pending/unknown stories. Automatically updated ${updatedCount} stories with correct narrator/writer metadata.`,
      updatedCount,
      totalChecked: storiesToFix.length,
    });
  } catch (error: unknown) {
    console.error('Fix narrators error:', error);
    return NextResponse.json({ error: 'Failed to fix narrators' }, { status: 500 });
  }
}
