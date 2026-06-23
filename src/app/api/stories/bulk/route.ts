import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import { getUserFromSession } from '@/lib/auth';
import { getYouTubeId } from '@/lib/youtube';
import { matchYouTubeChannel, CHANNELS, YOUTUBE_THUMBNAIL } from '@/lib/constants';

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

const BATCH_SIZE = 5;

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

interface BulkResult {
  row: number;
  title: string;
  status: 'success' | 'failed';
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();

    const { csv } = await request.json();
    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
    }

    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV is empty' }, { status: 400 });
    }

    let headerIndex = 0;
    const firstRow = rows[0].map((c) => c.toLowerCase().replace(/[^a-z]/g, ''));
    const hasHeader = firstRow.some((c) => c.includes('title') || c.includes('story') || c.includes('youtube'));
    if (hasHeader) headerIndex = 1;

    const dataRows = rows.slice(headerIndex);

    // Phase 1: Validate all rows and collect youtube IDs that need channel detection
    const parsedRows: { rowNum: number; title: string; writer: string; narrator: string; yearStr: string; youtubeUrl: string; youtubeId: string; channelOverride: string | null }[] = [];
    const results: BulkResult[] = [];
    const idsToDetect: { index: number; id: string }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = headerIndex + i + 1;
      const [title, writer, narrator, yearStr, youtubeUrl, channelOverride] = dataRows[i];

      if (!title) {
        results.push({ row: rowNum, title: '(empty)', status: 'failed', error: 'Missing story title' });
        continue;
      }
      if (!youtubeUrl) {
        results.push({ row: rowNum, title, status: 'failed', error: 'Missing YouTube URL' });
        continue;
      }

      const youtubeId = getYouTubeId(youtubeUrl);
      if (!youtubeId) {
        results.push({ row: rowNum, title, status: 'failed', error: 'Invalid YouTube URL' });
        continue;
      }

      const parsed = { rowNum, title: title.trim(), writer: writer?.trim() || '', narrator: narrator?.trim() || 'Unknown', yearStr, youtubeUrl: youtubeUrl.trim(), youtubeId, channelOverride: channelOverride?.trim() || null };
      parsedRows.push(parsed);
      if (!parsed.channelOverride) {
        idsToDetect.push({ index: parsedRows.length - 1, id: youtubeId });
      }
    }

    // Phase 2: Batch detect channels (only for rows without channel override)
    let channelMap = new Map<string, string | null>();
    if (idsToDetect.length > 0) {
      const uniqueIds = [...new Set(idsToDetect.map((d) => d.id))];
      channelMap = await detectChannelsInBatches(uniqueIds);
    }

    // Phase 3: Batch duplicate check
    const allYoutubeIds = parsedRows.map((r) => r.youtubeId);
    const existingStories = await Story.find({ youtubeId: { $in: allYoutubeIds } }).select('youtubeId').lean();
    const existingSet = new Set(existingStories.map((s) => s.youtubeId));

    // Phase 4: Create stories
    const finalResults: BulkResult[] = [...results];

    for (const row of parsedRows) {
      // Duplicate check
      if (existingSet.has(row.youtubeId)) {
        finalResults.push({ row: row.rowNum, title: row.title, status: 'failed', error: 'Duplicate YouTube URL' });
        continue;
      }

      // Resolve channel
      let channel: string | null = row.channelOverride;
      if (!channel) {
        channel = channelMap.get(row.youtubeId) ?? null;
      }
      if (!channel) {
        finalResults.push({ row: row.rowNum, title: row.title, status: 'failed', error: 'Channel not in allowed list (Sunday Suspense, Goppo Mirer Thek, Midnight Horror Station, Kahon)' });
        continue;
      }

      // Year
      let yearPublished: number | undefined;
      if (row.yearStr) {
        const parsed = parseInt(row.yearStr, 10);
        if (parsed >= 1900 && parsed <= 2100) yearPublished = parsed;
      }

      try {
        await Story.create({
          title: row.title,
          channel,
          youtubeUrl: row.youtubeUrl,
          youtubeId: row.youtubeId,
          thumbnailUrl: YOUTUBE_THUMBNAIL(row.youtubeId),
          description: '',
          narrator: row.narrator,
          genre: 'Horror',
          writer: row.writer,
          yearPublished,
          addedBy: user.id as mongoose.Types.ObjectId,
          approved: true,
          averageRating: 0,
          ratingsCount: 0,
        });

        if (row.writer) {
          const existingWriter = await Writer.findOne({ name: { $regex: `^${row.writer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
          if (!existingWriter) await Writer.create({ name: row.writer });
        }

        finalResults.push({ row: row.rowNum, title: row.title, status: 'success' });
      } catch (err) {
        finalResults.push({ row: row.rowNum, title: row.title, status: 'failed', error: err instanceof Error ? err.message : 'Failed to create' });
      }
    }

    const successCount = finalResults.filter((r) => r.status === 'success').length;
    const failedCount = finalResults.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      message: `Processed ${dataRows.length} rows: ${successCount} added, ${failedCount} failed.`,
      total: dataRows.length,
      success: successCount,
      failed: failedCount,
      results: finalResults,
    });
  } catch (error: unknown) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk upload failed' },
      { status: 500 }
    );
  }
}
