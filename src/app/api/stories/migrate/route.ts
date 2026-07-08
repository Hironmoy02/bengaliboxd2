import '@/lib/polyfill';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';
import { fetchYouTubeMeta } from '@/lib/youtube-meta';
import { matchYouTubeChannel, YOUTUBE_THUMBNAIL } from '@/lib/constants';
import { toSearchable } from '@/lib/transliterate';

interface MigrateRow {
  title?: string;
  writer?: string;
  narrator?: string;
  genre?: string;
  tags?: string[];
  duration?: number | string;
  year?: number | string;
  youtubeUrl: string;
}

interface MigrateResult {
  row: number;
  title: string;
  status: 'created' | 'updated' | 'unchanged' | 'failed';
  error?: string;
}

function parseDurationToSeconds(val: number | string | undefined): number | undefined {
  if (!val && val !== 0) return undefined;
  const str = String(val).trim();
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    return n > 0 ? n : undefined;
  }
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return undefined;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return undefined;
}

const BATCH_SIZE = 10;

async function fetchMetaInBatches(youtubeIds: string[]): Promise<Map<string, { duration?: number; year?: number }>> {
  const metaMap = new Map<string, { duration?: number; year?: number }>();
  for (let i = 0; i < youtubeIds.length; i += BATCH_SIZE) {
    const batch = youtubeIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (id) => {
      const meta = await fetchYouTubeMeta(id);
      return [id, meta] as const;
    });
    const results = await Promise.all(promises);
    for (const [id, meta] of results) {
      metaMap.set(id, meta);
    }
  }
  return metaMap;
}

async function detectChannelsInBatches(youtubeIds: string[]): Promise<Map<string, string | null>> {
  const channelMap = new Map<string, string | null>();
  for (let i = 0; i < youtubeIds.length; i += BATCH_SIZE) {
    const batch = youtubeIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (id) => {
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!res.ok) return [id, null] as const;
        const data = await res.json();
        return [id, matchYouTubeChannel(data.author_name || '')] as const;
      } catch {
        return [id, null] as const;
      }
    });
    const results = await Promise.all(promises);
    for (const [id, channel] of results) {
      channelMap.set(id, channel);
    }
  }
  return channelMap;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();

    const { rows } = await request.json() as { rows: MigrateRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Rows data is required' }, { status: 400 });
    }

    // Phase 1: Validate and extract YouTube IDs
    const parsedRows: { rowNum: number; row: MigrateRow; youtubeId: string }[] = [];
    const results: MigrateResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      if (!row.youtubeUrl || typeof row.youtubeUrl !== 'string') {
        results.push({ row: rowNum, title: row.title || '(empty)', status: 'failed', error: 'Missing YouTube URL' });
        continue;
      }

      const youtubeId = getYouTubeId(row.youtubeUrl);
      if (!youtubeId) {
        results.push({ row: rowNum, title: row.title || '', status: 'failed', error: 'Invalid YouTube URL' });
        continue;
      }

      parsedRows.push({ rowNum, row, youtubeId });
    }

    // Phase 2-4: Run channel detection, metadata fetch, and DB lookup in parallel
    const allYoutubeIds = parsedRows.map((r) => r.youtubeId);
    const uniqueIds = [...new Set(allYoutubeIds)];

    const [channelMap, metaMap, existingStories] = await Promise.all([
      detectChannelsInBatches(uniqueIds),
      fetchMetaInBatches(uniqueIds),
      Story.find({ youtubeId: { $in: allYoutubeIds } }).select('youtubeId').lean(),
    ]);
    const existingSet = new Set(existingStories.map((s) => s.youtubeId));

    // Phase 5: Process each row
    const finalResults: MigrateResult[] = [...results];

    for (const { rowNum, row, youtubeId } of parsedRows) {
      const isDuplicate = existingSet.has(youtubeId);
      const meta = metaMap.get(youtubeId) || {};

      // Parse data
      const title = row.title ? String(row.title).trim() : '';
      const writer = row.writer ? String(row.writer).trim() : '';
      const narrator = row.narrator ? String(row.narrator).trim() : '';
      const genre = row.genre ? String(row.genre).trim() : '';
      const tags = Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? String(row.tags).split(',').map((t) => t.trim()).filter(Boolean) : []);
      const durationSec = parseDurationToSeconds(row.duration);
      const yearVal = row.year ? parseInt(String(row.year), 10) : undefined;
      const yearPublished = (yearVal && yearVal >= 1900 && yearVal <= 2100) ? yearVal : undefined;

      // Detect channel
      let channel: string | null = channelMap.get(youtubeId) ?? null;
      if (!channel) channel = 'Goppo Mirer Thek';

      if (isDuplicate) {
        // Update existing story
        try {
          const existing = await Story.findOne({ youtubeId }).lean();
          if (!existing) {
            finalResults.push({ row: rowNum, title: title || youtubeId, status: 'failed', error: 'Story not found' });
            continue;
          }

          const updateFields: Record<string, unknown> = {};
          if (title && title !== existing.title) updateFields.title = title;
          if (writer && writer !== existing.writer) updateFields.writer = writer;
          if (narrator && narrator !== existing.narrator) updateFields.narrator = narrator;
          if (genre && genre !== existing.genre) updateFields.genre = genre;
          if (yearPublished && yearPublished !== existing.yearPublished) updateFields.yearPublished = yearPublished;
          if (durationSec && durationSec !== existing.duration) updateFields.duration = durationSec;
          if (tags.length > 0) updateFields.tags = tags;
          if (title) updateFields.titleSearch = toSearchable(title);
          if (!existing.approved) updateFields.approved = true;

          if (Object.keys(updateFields).length > 0) {
            await Story.updateOne({ _id: existing._id }, { $set: updateFields });
            if (writer) {
              const existingWriter = await Writer.findOne({ name: { $regex: `^${writer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
              if (!existingWriter) await Writer.create({ name: writer });
            }
            finalResults.push({ row: rowNum, title: title || existing.title, status: 'updated' });
          } else {
            finalResults.push({ row: rowNum, title: title || existing.title, status: 'unchanged' });
          }
        } catch (err) {
          finalResults.push({ row: rowNum, title: title || youtubeId, status: 'failed', error: err instanceof Error ? err.message : 'Update failed' });
        }
      } else {
        // Create new story
        try {
          const resolvedTitle = title || (meta.year ? `Story ${rowNum}` : '');
          if (!resolvedTitle) {
            finalResults.push({ row: rowNum, title: '', status: 'failed', error: 'Title is required for new stories' });
            continue;
          }

          await Story.create({
            title: resolvedTitle,
            channel,
            youtubeUrl: row.youtubeUrl.trim(),
            youtubeId,
            thumbnailUrl: YOUTUBE_THUMBNAIL(youtubeId),
            description: '',
            narrator: narrator || 'Unknown',
            genre: genre || 'Horror',
            writer,
            titleSearch: toSearchable(resolvedTitle),
            yearPublished: yearPublished || meta.year,
            duration: durationSec || meta.duration,
            tags,
            addedBy: user.id as mongoose.Types.ObjectId,
            approved: true,
            averageRating: 0,
            ratingsCount: 0,
          });

          if (writer) {
            const existingWriter = await Writer.findOne({ name: { $regex: `^${writer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
            if (!existingWriter) await Writer.create({ name: writer });
          }

          finalResults.push({ row: rowNum, title: resolvedTitle, status: 'created' });
        } catch (err) {
          finalResults.push({ row: rowNum, title: title || youtubeId, status: 'failed', error: err instanceof Error ? err.message : 'Create failed' });
        }
      }
    }

    const createdCount = finalResults.filter((r) => r.status === 'created').length;
    const updatedCount = finalResults.filter((r) => r.status === 'updated').length;
    const unchangedCount = finalResults.filter((r) => r.status === 'unchanged').length;
    const failedCount = finalResults.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      message: `Processed ${rows.length} rows: ${createdCount} created, ${updatedCount} updated, ${unchangedCount} unchanged, ${failedCount} failed.`,
      total: rows.length,
      created: createdCount,
      updated: updatedCount,
      unchanged: unchangedCount,
      failed: failedCount,
      results: finalResults,
    });
  } catch (error: unknown) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}
