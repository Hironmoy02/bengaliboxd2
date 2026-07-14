import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Writer from '@/models/Writer';
import { fetchYouTubeMeta } from '@/lib/youtube-meta';
import { toSearchable } from '@/lib/transliterate';
import { YOUTUBE_THUMBNAIL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const CHANNELS_SYNC = [
  {
    name: 'Sunday Suspense',
    channelId: 'UCmzj6hXrPZ_AwIZ8lgo-HuQ',
    keywords: ['suspense', 'mirchi', 'horror'],
  },
  {
    name: 'Goppo Mirer Thek',
    channelId: 'UCkvRE7QapbwT97rFj40u1Dw',
    keywords: ['thek', 'mir afsar', 'mir', 'sayak'],
  }
];

const COMMON_NARRATORS = ["Mir", "Deep", "Somak", "Jojo", "Sayak", "Agni", "Pushpal", "Anujoy", "Godhuli", "Sree", "Richard", "Papiya", "Sabyasachi"];
const GENRES = ["Horror", "Mystery", "Thriller", "Drama", "Comedy", "Classic", "Adventure"];

function parseRssFeed(xmlText: string) {
  const entries: { videoId: string; title: string; published: string; description: string }[] = [];
  const entryMatches = xmlText.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
  for (const match of entryMatches) {
    const content = match[1];
    const videoIdMatch = content.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = content.match(/<published>([^<]+)<\/published>/);
    const descMatch = content.match(/<media:description>([\s\S]*?)<\/media:description>/);
    
    if (videoIdMatch && titleMatch) {
      entries.push({
        videoId: videoIdMatch[1].trim(),
        title: titleMatch[1].trim(),
        published: publishedMatch ? publishedMatch[1].trim() : '',
        description: descMatch ? descMatch[1].trim() : '',
      });
    }
  }
  return entries;
}

function cleanTitle(title: string, channelName: string, writer: string, narratorsMatched: string[]): string {
  let cleaned = title;
  
  const noise = [
    channelName,
    "Sunday Suspense",
    "Goppo Mirer Thek",
    "Mirchi Bangla",
    "Audio Story",
    "Bengali Audio Story",
    "Psychological Horror Thriller",
    "#GoppoMirerThek",
    "Full Story",
    "SundaySuspense"
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
      .map((w: any) => w.name.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const report: {
      channel: string;
      fetched: number;
      imported: { title: string; youtubeId: string; writer: string; narrators: string }[];
      skipped: string[];
    }[] = [];

    for (const chanConfig of CHANNELS_SYNC) {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${chanConfig.channelId}`;
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (!res.ok) {
        report.push({
          channel: chanConfig.name,
          fetched: 0,
          imported: [],
          skipped: [`Failed to fetch feed (status: ${res.status})`],
        });
        continue;
      }

      const xmlText = await res.text();
      const entries = parseRssFeed(xmlText);

      const channelReport = {
        channel: chanConfig.name,
        fetched: entries.length,
        imported: [] as any[],
        skipped: [] as string[],
      };

      for (const entry of entries) {
        const exists = await Story.findOne({ youtubeId: entry.videoId }).lean();
        if (exists) {
          channelReport.skipped.push(`${entry.title} (already in DB)`);
          continue;
        }

        const titleLower = entry.title.toLowerCase();
        const descLower = entry.description.toLowerCase();
        const matchesKeywords = chanConfig.keywords.some(
          kw => titleLower.includes(kw) || descLower.includes(kw)
        );

        if (!matchesKeywords) {
          channelReport.skipped.push(`${entry.title} (did not match channel keywords)`);
          continue;
        }

        let matchedWriter = 'Unknown';
        // Pass 1: Look for explicit "by <Writer Name>" pattern in title/description
        for (const writerName of registeredWriters) {
          const escaped = writerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const byReg = new RegExp(`\\bby\\s+${escaped}\\b`, 'i');
          if (byReg.test(entry.title) || byReg.test(entry.description)) {
            matchedWriter = writerName;
            break;
          }
        }

        // Pass 2: Fallback to substring matching on normalized writer names (removing spaces/punctuation)
        if (matchedWriter === 'Unknown') {
          const cleanTitleStr = entry.title.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]/g, '');
          const cleanDescStr = entry.description.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]/g, '');
          
          for (const writerName of registeredWriters) {
            const cleanWriter = writerName.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]/g, '');
            if (cleanWriter.length < 4) continue;
            
            if (cleanTitleStr.includes(cleanWriter) || cleanDescStr.includes(cleanWriter)) {
              matchedWriter = writerName;
              break;
            }
          }
        }

        const matchedNarrators: string[] = [];
        for (const narratorName of COMMON_NARRATORS) {
          const reg = new RegExp(`\\b${narratorName}\\b`, 'i');
          if (reg.test(entry.title) || reg.test(entry.description)) {
            matchedNarrators.push(narratorName);
          }
        }
        const finalNarrators = matchedNarrators.length > 0 ? matchedNarrators.join(', ') : 'Unknown';

        const cleanStoryTitle = cleanTitle(entry.title, chanConfig.name, matchedWriter, matchedNarrators);
        if (!cleanStoryTitle) {
          channelReport.skipped.push(`${entry.title} (could not generate a clean title)`);
          continue;
        }

        let matchedGenre = 'Horror';
        for (const genre of GENRES) {
          const reg = new RegExp(`\\b${genre}\\b`, 'i');
          if (reg.test(entry.title) || reg.test(entry.description)) {
            matchedGenre = genre;
            break;
          }
        }

        let durationSec = undefined;
        let yearPublished = undefined;
        try {
          const meta = await fetchYouTubeMeta(entry.videoId);
          if (meta.duration) durationSec = meta.duration;
          if (meta.year) yearPublished = meta.year;
        } catch { }

        if (!yearPublished) {
          const y = parseInt(entry.published.slice(0, 4), 10);
          if (y >= 1900 && y <= 2100) yearPublished = y;
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
          approved: true,
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

        channelReport.imported.push({
          title: cleanStoryTitle,
          youtubeId: entry.videoId,
          writer: matchedWriter,
          narrators: finalNarrators,
        });
      }

      report.push(channelReport);
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly story sync completed.',
      report,
    });
  } catch (error: any) {
    console.error('Story sync cron error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
