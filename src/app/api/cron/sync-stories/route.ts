import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import { fetchYouTubeMeta, fetchChannelVideos, extractNarrators, extractWriters } from '@/lib/youtube-meta';
import { toSearchable } from '@/lib/transliterate';
import { YOUTUBE_THUMBNAIL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const CHANNELS_SYNC = [
  {
    name: 'Sunday Suspense',
    channelId: 'UCmzj6hXrPZ_AwIZ8lgo-HuQ',
  },
  {
    name: 'Goppo Mirer Thek',
    channelId: 'UCkvRE7QapbwT97rFj40u1Dw',
  },
];

const COMMON_NARRATORS = ["Mir", "Deep", "Somak", "Jojo", "Sayak", "Agni", "Pushpal", "Anujoy", "Godhuli", "Sree", "Richard", "Papiya", "Sabyasachi"];
const GENRES = ["Horror", "Mystery", "Thriller", "Drama", "Comedy", "Classic", "Adventure"];
const MIN_DURATION_SECONDS = 1200;
const MAX_VIDEOS_PER_CHANNEL = 200;

function cleanTitle(title: string, channelName: string, writer: string, narratorsMatched: string[]): string {
  let cleaned = title;

  const noise = [
    channelName,
    "Sunday Suspense",
    "SundaySuspense",
    "Goppo Mirer Thek",
    "Mirchi Bangla",
    "Friday Classics",
    "FridayClassics",
    "Classics",
    "Audio Story",
    "Bengali Audio Story",
    "Psychological Horror Thriller",
    "#GoppoMirerThek",
    "Full Story",
  ];

  for (const n of noise) {
    const reg = new RegExp(`\\b${n}\\b|${n}`, "gi");
    cleaned = cleaned.replace(reg, "");
  }

  if (writer) {
    const reg = new RegExp(`\\bby\\s+${writer}\\b|\\b${writer}\\b|${writer}`, "gi");
    cleaned = cleaned.replace(reg, "");
  }

  for (const n of narratorsMatched) {
    const reg = new RegExp(`\\b${n}\\b`, "gi");
    cleaned = cleaned.replace(reg, "");
  }

  cleaned = cleaned.replace(/\|/g, " ");
  cleaned = cleaned.replace(/^[-\s:|]+|[-\s:|]+$/g, "");
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
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
        const exists = await Story.findOne({ youtubeId: entry.videoId }).lean();
        if (exists) {
          channelReport.skipped.push(`${entry.title} (already in DB)`);
          continue;
        }

        let durationSec: number | undefined = entry.durationSeconds;
        let yearPublished: number | undefined;
        let videoDesc = entry.description || '';

        if (!durationSec || !yearPublished || !videoDesc) {
          try {
            const meta = await fetchYouTubeMeta(entry.videoId);
            if (!durationSec && meta.duration) durationSec = meta.duration;
            if (!yearPublished && meta.year) yearPublished = meta.year;
            if (!videoDesc && meta.description) videoDesc = meta.description;
          } catch { /* ignore */ }
        }

        if (!yearPublished && entry.published) {
          const y = parseInt(entry.published.slice(0, 4), 10);
          if (y >= 1900 && y <= 2100) yearPublished = y;
        }

        if (!durationSec || durationSec < MIN_DURATION_SECONDS) {
          const displayDuration = durationSec ? `${Math.floor(durationSec / 60)}m` : 'unknown';
          channelReport.skipped.push(`${entry.title} (duration ${displayDuration} < 20 min)`);
          continue;
        }

        const matchedWriter = extractWriters(entry.title, videoDesc, chanConfig.name);
        const finalNarrators = extractNarrators(entry.title, videoDesc, chanConfig.name);

        const cleanStoryTitle = cleanTitle(entry.title, chanConfig.name, matchedWriter, [finalNarrators]);
        if (!cleanStoryTitle) {
          channelReport.skipped.push(`${entry.title} (could not generate a clean title)`);
          continue;
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
          description: entry.description.slice(0, 500) || '',
          narrator: finalNarrators,
          genre: matchedGenre,
          writer: matchedWriter,
          titleSearch: toSearchable(cleanStoryTitle),
          yearPublished,
          duration: durationSec,
          tags: [],
          approved: false,
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
