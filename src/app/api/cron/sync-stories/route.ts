import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import BlockedVideo from '@/models/BlockedVideo';
import { fetchYouTubeMeta, fetchChannelVideos, extractNarrators, extractWriters } from '@/lib/youtube-meta';
import { toSearchable } from '@/lib/transliterate';
import { YOUTUBE_THUMBNAIL } from '@/lib/constants';

import { smartCleanTitle } from '@/lib/title-cleaner';

export const dynamic = 'force-dynamic';

const CHANNELS_SYNC = [
  {
    name: 'Sunday Suspense',
    // Mirchi Bangla publishes many shows (Crime Katha, serials, etc.).
    // We ONLY want videos whose title explicitly contains "Sunday Suspense".
    channelId: 'UCmzj6hXrPZ_AwIZ8lgo-HuQ',
    titleFilter: /sunday\s*suspense/i,
  },
  {
    name: 'Goppo Mirer Thek',
    // Dedicated channel — every video is a Goppo Mirer Thek story.
    channelId: 'UCkvRE7QapbwT97rFj40u1Dw',
    titleFilter: null, // no filter — accept all videos
  },
];

const COMMON_NARRATORS = ["Mir", "Deep", "Somak", "Jojo", "Sayak", "Agni", "Pushpal", "Anujoy", "Godhuli", "Sree", "Richard", "Papiya", "Sabyasachi"];
const GENRES = ["Horror", "Mystery", "Thriller", "Drama", "Comedy", "Classic", "Adventure"];
const MIN_DURATION_SECONDS = 300; // 5 minutes minimum (allow short stories and multi-part episodes)
const MAX_VIDEOS_PER_CHANNEL = 200;

function cleanTitle(title: string, channelName: string, writer: string, narratorsMatched: string[]): string {
  return smartCleanTitle(title, writer);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && process.env.CRON_SECRET && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const dbWriters = await Writer.find({}).select('name').lean();
    const registeredWriters = dbWriters
      .map((w: { name: string }) => w.name.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const report: {
      channel: string;
      fetched: number;
      imported: { title: string; youtubeId: string; writer: string; narrators: string; duration: string }[];
      skipped: string[];
    }[] = [];

    for (const chanConfig of CHANNELS_SYNC) {
      const entries = await fetchChannelVideos(chanConfig.channelId, MAX_VIDEOS_PER_CHANNEL);

      const channelReport = {
        channel: chanConfig.name,
        fetched: entries.length,
        imported: [] as { title: string; youtubeId: string; writer: string; narrators: string; duration: string }[],
        skipped: [] as string[],
      };

      for (const entry of entries) {
        // --- Title filter: for Sunday Suspense we only want videos that
        //     explicitly say "Sunday Suspense" in the raw YouTube title.
        if (chanConfig.titleFilter && !chanConfig.titleFilter.test(entry.title)) {
          channelReport.skipped.push(`${entry.title} (title doesn't match channel filter)`);
          continue;
        }

        // --- Blocklist check: skip videos the admin has previously rejected
        const isBlocked = await BlockedVideo.exists({ youtubeId: entry.videoId });
        if (isBlocked) {
          channelReport.skipped.push(`${entry.title} (admin rejected — blocked)`);
          continue;
        }

        const exists = await Story.findOne({ youtubeId: entry.videoId }).lean();
        if (exists) {
          channelReport.skipped.push(`${entry.title} (already in DB)`);
          continue;
        }

        let durationSec: number | undefined = entry.durationSeconds;
        let yearPublished: number | undefined;
        let videoDesc = entry.description || '';

        // Always fetch full metadata from the InnerTube player API —
        // the channel-page scraper often omits duration/year for brand-new videos.
        try {
          const meta = await fetchYouTubeMeta(entry.videoId);
          if (!durationSec && meta.duration) durationSec = meta.duration;
          if (!yearPublished && meta.year) yearPublished = meta.year;
          if (!videoDesc && meta.description) videoDesc = meta.description;
        } catch { /* ignore individual video fetch errors */ }

        // Parse year from the channel-page published field as a fallback.
        // YouTube returns a relative string ("2 days ago", "3 months ago", etc.)
        // rather than an ISO date, so we convert it to an approximate year.
        if (!yearPublished) {
          const pub = entry.published || '';
          // Try ISO/year-first format first (e.g. "2024-08-23" or "2024")
          const isoMatch = pub.match(/^(\d{4})/);
          if (isoMatch) {
            const y = parseInt(isoMatch[1], 10);
            if (y >= 1900 && y <= 2100) yearPublished = y;
          } else {
            // Handle "N days ago", "N weeks ago", "N months ago", "N years ago"
            const relMatch = pub.match(/(\d+)\s*(day|week|month|year)/i);
            const now = new Date();
            if (relMatch) {
              const num = parseInt(relMatch[1], 10);
              const unit = relMatch[2].toLowerCase();
              const approx = new Date(now);
              if (unit.startsWith('day'))   approx.setDate(now.getDate() - num);
              else if (unit.startsWith('week'))  approx.setDate(now.getDate() - num * 7);
              else if (unit.startsWith('month')) approx.setMonth(now.getMonth() - num);
              else if (unit.startsWith('year'))  approx.setFullYear(now.getFullYear() - num);
              yearPublished = approx.getFullYear();
            } else if (pub) {
              // Unknown format — fall back to current year for any non-empty published string
              yearPublished = now.getFullYear();
            }
          }
        }

        if (!durationSec || durationSec < MIN_DURATION_SECONDS) {
          const displayDuration = durationSec ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : 'unknown';
          channelReport.skipped.push(`${entry.title} (duration ${displayDuration} < 5 min)`);
          continue;
        }

        const matchedWriter = extractWriters(entry.title, videoDesc, chanConfig.name);
        const finalNarrators = extractNarrators(entry.title, videoDesc, chanConfig.name);

        let cleanStoryTitle = cleanTitle(entry.title, chanConfig.name, matchedWriter, [finalNarrators]);
        if (!cleanStoryTitle) {
          cleanStoryTitle = entry.title
            .replace(/Sunday\s*Suspense|Goppo\s*Mirer\s*Thek|Mirchi\s*Bangla/gi, '')
            .replace(/^[\s|\-:]+/, '')
            .trim() || entry.title;
        }

        let matchedGenre = 'Horror';
        for (const genre of GENRES) {
          const reg = new RegExp(`\\b${genre}\\b`, 'i');
          if (reg.test(entry.title) || reg.test(videoDesc)) {
            matchedGenre = genre;
            break;
          }
        }

        await Story.create({
          title: cleanStoryTitle,
          channel: chanConfig.name,
          youtubeUrl: `https://www.youtube.com/watch?v=${entry.videoId}`,
          youtubeId: entry.videoId,
          thumbnailUrl: YOUTUBE_THUMBNAIL(entry.videoId),
          description: videoDesc.slice(0, 1000) || '',
          narrator: finalNarrators,
          genre: matchedGenre,
          writer: matchedWriter,
          titleSearch: toSearchable(cleanStoryTitle),
          yearPublished,
          duration: durationSec,
          tags: [],
          approved: false,
          source: 'youtube_sync',
          averageRating: 0,
          ratingsCount: 0,
        });

        if (matchedWriter !== 'Unknown') {
          const writerExists = await Writer.findOne({
            name: { $regex: `^${matchedWriter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
          }).lean();
          if (!writerExists) {
            await Writer.create({ name: matchedWriter });
          }
        }

        const displayDur = durationSec ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : 'N/A';
        channelReport.imported.push({
          title: cleanStoryTitle,
          youtubeId: entry.videoId,
          writer: matchedWriter,
          narrators: finalNarrators,
          duration: displayDur,
        });
      }

      report.push(channelReport);
    }

    return NextResponse.json({
      success: true,
      message: 'Story sync completed.',
      report,
    });
  } catch (error: unknown) {
    console.error('Story sync cron error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
