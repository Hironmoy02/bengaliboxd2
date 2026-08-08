export interface YouTubeMeta {
  duration?: number;
  year?: number;
  description?: string;
}

export interface ChannelVideo {
  videoId: string;
  title: string;
  published: string;
  description: string;
  durationSeconds?: number;
}

const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20250601.00.00',
};

const INNERTUBE_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999',
};

const VIDEOS_TAB_PARAMS = 'EgZ2aWRlb3PyBgQKAjoA';

function parseDurationString(durationStr: string): number | undefined {
  if (!durationStr) return undefined;
  const cleaned = durationStr.trim();
  const parts = cleaned.split(':').map(Number);
  if (parts.some(isNaN)) return undefined;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return undefined;
}

function extractVideoFromLockup(lockup: Record<string, unknown>): ChannelVideo | null {
  const videoId = lockup.contentId as string | undefined;
  if (!videoId) return null;

  const meta = (lockup.metadata as Record<string, unknown>)?.lockupMetadataViewModel as Record<string, unknown> | undefined;
  const titleObj = (meta?.title as Record<string, unknown>)?.content as string | undefined;
  const title = titleObj || '';

  let published = '';
  const metadataRows = ((meta?.metadata as Record<string, unknown>)?.contentMetadataViewModel as Record<string, unknown>)?.metadataRows as Record<string, unknown>[] | undefined;
  if (metadataRows?.[0]) {
    const parts = (metadataRows[0] as Record<string, unknown>).metadataParts as Record<string, unknown>[] | undefined;
    if (parts?.[1]) {
      published = ((parts[1] as Record<string, unknown>).text as Record<string, unknown>)?.content as string || '';
    }
  }

  let durationSeconds: number | undefined;
  const overlays = ((lockup.contentImage as Record<string, unknown>)?.thumbnailViewModel as Record<string, unknown>)?.overlays as Record<string, unknown>[] | undefined;
  if (overlays?.[0]) {
    const badges = ((overlays[0] as Record<string, unknown>)?.thumbnailBottomOverlayViewModel as Record<string, unknown>)?.badges as Record<string, unknown>[] | undefined;
    if (badges?.[0]) {
      const durationText = ((badges[0] as Record<string, unknown>).thumbnailBadgeViewModel as Record<string, unknown>)?.text as string | undefined;
      if (durationText) durationSeconds = parseDurationString(durationText);
    }
  }

  return { videoId, title, published, description: '', durationSeconds };
}

function extractVideoFromRenderer(renderer: Record<string, unknown>): ChannelVideo | null {
  const videoId = renderer.videoId as string | undefined;
  if (!videoId) return null;

  const titleRuns = (renderer.title as Record<string, unknown>)?.runs as { text: string }[] | undefined;
  const title = titleRuns?.[0]?.text || '';

  const published = ((renderer.publishedTimeText as Record<string, unknown>)?.simpleText as string) || '';

  const snippets = renderer.detailedMetadataSnippets as Record<string, unknown>[] | undefined;
  const snippetRuns = (snippets?.[0]?.snippetText as Record<string, unknown>)?.runs as { text: string }[] | undefined;
  const description = snippetRuns?.map((r) => r.text).join('') || '';

  const lengthStr = (renderer.lengthSeconds as string) || (renderer.lengthText as Record<string, unknown>)?.simpleText as string | undefined;
  const durationSeconds = parseDurationString(lengthStr || '');

  return { videoId, title, published, description, durationSeconds };
}

export async function fetchChannelVideos(channelId: string, maxResults: number): Promise<ChannelVideo[]> {
  const videos: ChannelVideo[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const body: Record<string, unknown> = {
        context: { client: INNERTUBE_CLIENT },
        browseId: channelId,
      };

      if (continuationToken) {
        body.continuation = continuationToken;
      } else {
        body.params = VIDEOS_TAB_PARAMS;
      }

      const res = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
        method: 'POST',
        headers: INNERTUBE_HEADERS,
        body: JSON.stringify(body),
      });

      if (!res.ok) break;
      const data = await res.json();

      const items: Record<string, unknown>[] = [];
      let newContinuation: string | undefined;

      if (continuationToken) {
        const actions = (data.onResponseReceivedActions as Record<string, unknown>[]) || [];
        for (const action of actions) {
          const append = (action.appendContinuationItemsAction as Record<string, unknown>)?.continuationItems as Record<string, unknown>[] | undefined;
          if (append) items.push(...append);
        }
      } else {
        const tabs = ((data.contents as Record<string, unknown>)?.twoColumnBrowseResultsRenderer as Record<string, unknown>)?.tabs as Record<string, unknown>[] | undefined;
        if (tabs) {
          for (const tab of tabs) {
            const tabTitle = (tab.tabRenderer as Record<string, unknown>)?.title;
            if (tabTitle !== 'Videos') continue;
            const richGrid = ((tab.tabRenderer as Record<string, unknown>)?.content as Record<string, unknown>)?.richGridRenderer as Record<string, unknown> | undefined;
            const contents = richGrid?.contents as Record<string, unknown>[] | undefined;
            if (contents) items.push(...contents);
          }
        }
      }

      for (const item of items) {
        const richItem = item.richItemRenderer as Record<string, unknown> | undefined;
        const content = richItem?.content as Record<string, unknown> | undefined;
        if (!content) continue;

        let video: ChannelVideo | null = null;

        const lockup = content.lockupViewModel as Record<string, unknown> | undefined;
        if (lockup) {
          video = extractVideoFromLockup(lockup);
        } else {
          const videoRenderer = content.videoRenderer as Record<string, unknown> | undefined;
          if (videoRenderer) {
            video = extractVideoFromRenderer(videoRenderer);
          }
        }

        if (video) videos.push(video);

        const contItem = item.continuationItemRenderer as Record<string, unknown> | undefined;
        const contEndpoint = contItem?.continuationEndpoint as Record<string, unknown> | undefined;
        const contCommand = contEndpoint?.continuationCommand as Record<string, unknown> | undefined;
        if (contCommand?.token) {
          newContinuation = contCommand.token as string;
        }
      }

      continuationToken = newContinuation;
    } while (continuationToken && videos.length < maxResults);
  } catch {
    // Return whatever we have so far
  }

  return videos.slice(0, maxResults);
}


export const COMMON_NARRATORS = [
  "Mir", "Deep", "Somak", "Jojo", "Sayak", "Agni", "Pushpal",
  "Anujoy", "Godhuli", "Sree", "Richard", "Papiya", "Sabyasachi",
  "Jagannath", "Urmimala", "Roy", "Riya", "Parambrata", "Gargi",
  "Chiranjeet", "Koushik", "Subhodip", "Shubhadeep", "Bhaswar", "Pradip"
];

export const COMMON_WRITERS: { name: string; aliases: string[] }[] = [
  { name: 'Rabindranath Tagore', aliases: ['Rabindranath Tagore', 'Rabindranath', 'Tagore', 'রবীন্দ্রনাথ ঠাকুর', 'রবীন্দ্রনাথ'] },
  { name: 'Satyajit Ray', aliases: ['Satyajit Ray', 'Satyajit', 'Ray', 'সত্যজিৎ রায়', 'সত্যজিৎ'] },
  { name: 'Sharadindu Bandyopadhyay', aliases: ['Sharadindu Bandyopadhyay', 'Saradindu', 'Sharadindu', 'শরদিন্দু বন্দ্যোপাধ্যায়', 'শরদিন্দু'] },
  { name: 'Sukumar Ray', aliases: ['Sukumar Ray', 'Sukumar', 'সুকুমার রায়', 'সুকুমার'] },
  { name: 'Bibhutibhushan Bandyopadhyay', aliases: ['Bibhutibhushan Bandyopadhyay', 'Bibhutibhushan', 'বিভূতিভূষণ বন্দ্যোপাধ্যায়', 'বিভূতিভূষণ'] },
  { name: 'Tarashankar Bandyopadhyay', aliases: ['Tarashankar Bandyopadhyay', 'Tarashankar', 'তারাশঙ্কর বন্দ্যোপাধ্যায়', 'তারাশঙ্কর'] },
  { name: 'Manik Bandyopadhyay', aliases: ['Manik Bandyopadhyay', 'Manik', 'মানিক বন্দ্যোপাধ্যায়', 'মানিক'] },
  { name: 'Nihar Ranjan Gupta', aliases: ['Nihar Ranjan Gupta', 'Nihar Ranjan', 'নীহাররঞ্জন গুপ্ত', 'নীহার রঞ্জন'] },
  { name: 'Hemendra Kumar Roy', aliases: ['Hemendra Kumar Roy', 'Hemendra Kumar', 'হেমেন্দ্রকুমার রায়', 'হেমেন্দ্র কুমার'] },
  { name: 'Humayun Ahmed', aliases: ['Humayun Ahmed', 'Humayun', 'হুমায়ূন আহমেদ', 'হুমায়ূন'] },
  { name: 'Sirshendu Mukhopadhyay', aliases: ['Sirshendu Mukhopadhyay', 'Sirshendu', 'শীর্ষেন্দুমুখোপাধ্যায়', 'শীর্ষেন্দু'] },
  { name: 'Sunil Gangopadhyay', aliases: ['Sunil Gangopadhyay', 'Sunil', 'সুনীল গঙ্গোপাধ্যায়', 'সুনীল'] },
  { name: 'Samaresh Majumdar', aliases: ['Samaresh Majumdar', 'Samaresh', 'সমরেশ মজুমদার', 'সমরেশ'] },
  { name: 'Sanjib Chattopadhyay', aliases: ['Sanjib Chattopadhyay', 'Sanjib', 'সঞ্জীব চট্টোপাধ্যায়', 'সঞ্জীব'] },
  { name: 'Bimal Mitra', aliases: ['Bimal Mitra', 'বিমল মিত্র'] },
  { name: 'Ashapurna Devi', aliases: ['Ashapurna Devi', 'আশাপূর্ণা দেবী'] },
  { name: 'Leela Majumdar', aliases: ['Leela Majumdar', 'লীলা মজুমদার'] },
  { name: 'Upendrakishore Roy Chowdhury', aliases: ['Upendrakishore Roy Chowdhury', 'Upendrakishore', 'উপেন্দ্রকিশোর'] },
  { name: 'Premendra Mitra', aliases: ['Premendra Mitra', 'Premendra', 'প্রেমেন্দ্র মিত্র', 'প্রেমেন্দ্র'] },
  { name: 'Narayan Gangopadhyay', aliases: ['Narayan Gangopadhyay', 'Narayan', 'নারায়ণ গঙ্গোপাধ্যায়', 'নারায়ণ'] },
  { name: 'Shibram Chakraborty', aliases: ['Shibram Chakraborty', 'Shibram', 'শিবরাম চক্রবর্তী', 'শিবরাম'] },
  { name: 'Suchitra Bhattacharya', aliases: ['Suchitra Bhattacharya', 'Suchitra', 'সুচিত্রা ভট্টাচার্য', 'সুচিত্রা'] },
  { name: 'Abanindranath Tagore', aliases: ['Abanindranath Tagore', 'Abanindranath', 'অবনীন্দ্রনাথ'] },
  { name: 'Swapan Kumar', aliases: ['Swapan Kumar', 'স্বপন কুমার'] },
  { name: 'Adrish Bardhan', aliases: ['Adrish Bardhan', 'অদ্রীশ বর্ধন'] },
  { name: 'Syed Mustafa Siraj', aliases: ['Syed Mustafa Siraj', 'Mustafa Siraj', 'সৈয়দ মুস্তফা সিরাজ'] },
];

export function extractNarrators(title: string, description: string, channelName: string = ''): string {
  const combined = `${title} ${description}`;

  // 1. Match explicit Narrator line e.g. "Narrator Deep Kaizar Basu" or "Narrator: Deep"
  const explicitNarratorMatch = combined.match(/(?:narrator|narrated\s+by|voice(?: artist)?|pathak|গল্প\s*পাঠ|কণ্ঠ|পাঠ)\s*[:|-]?\s*([^\n\r,.;]+)/i);
  if (explicitNarratorMatch?.[1]) {
    const candidate = explicitNarratorMatch[1].trim();
    if (
      candidate.length >= 3 &&
      candidate.length <= 40 &&
      !/script|audio|sunday|suspense|mirchi|presents|radio|episode|part|classics|special/i.test(candidate)
    ) {
      return candidate;
    }
  }

  // 2. Search for common narrator names in title + description
  const matched: string[] = [];
  for (const name of COMMON_NARRATORS) {
    const reg = new RegExp(`\\b${name}\\b`, 'i');
    if (reg.test(combined) && !matched.includes(name)) {
      matched.push(name);
    }
  }

  if (matched.length > 0) {
    return matched.join(', ');
  }

  // 3. Fallback to channel default
  const cleanChan = channelName.toLowerCase();
  if (cleanChan.includes('mir') || cleanChan.includes('sunday suspense')) {
    return 'Mir';
  }

  return 'Mir';
}

export function extractWriters(title: string, description: string, channelName: string = ''): string {
  const combined = `${title} ${description}`;
  // Strip possessive 's (e.g. Tagore's -> Tagore) for regex matching
  const cleanedText = combined.replace(/'s\b/gi, '');

  // 1. Search famous Bengali writers first (highest priority)
  for (const w of COMMON_WRITERS) {
    for (const alias of w.aliases) {
      const reg = new RegExp(`\\b${alias}\\b`, 'i');
      if (reg.test(cleanedText)) {
        return w.name;
      }
    }
  }

  // 2. Explicit label match e.g. "Written by: ..." or "Author: ..."
  const writerMatch = combined.match(/(?:written\s+by|author|story\s+by|by|রচয়িতা|লেখক|মূল\s*গল্প)\s*[:|-]?\s*([A-Za-z\s\u0980-\u09ff]+)/i);
  if (writerMatch?.[1]) {
    const candidate = writerMatch[1].trim().split(/\n|\r|,|;|\./)[0].trim();
    if (candidate.length >= 3 && candidate.length <= 40 && !/sunday|suspense|audio|mirchi|present|radio/i.test(candidate)) {
      return candidate;
    }
  }

  // 3. Check if compilation / non-stop episode
  if (
    /non\s*stop|compilation|collection|24\s*hrs|special\s*episode|mega\s*episode|top\s*\d+/i.test(title) ||
    /non\s*stop|compilation|collection|24\s*hrs/i.test(description)
  ) {
    return 'Various Writers';
  }

  return 'Various Writers';
}

export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const result = await fetchViaInnerTube(videoId);
  if (result.duration || result.year || result.description) return result;
  return fetchViaHtmlScrape(videoId);
}

async function fetchViaInnerTube(videoId: string): Promise<YouTubeMeta> {
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999'
      },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion: '2.20250601.00.00' } },
        videoId,
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const meta: YouTubeMeta = {};

    const lengthStr = data?.videoDetails?.lengthSeconds;
    if (lengthStr) {
      const secs = parseInt(lengthStr, 10);
      if (secs > 0) meta.duration = secs;
    }

    const desc = data?.videoDetails?.shortDescription;
    if (desc) {
      meta.description = desc;
    }

    const publishDate: string | undefined =
      data?.microformat?.playerMicroformatRenderer?.publishDate ||
      data?.microformat?.playerMicroformatRenderer?.uploadDate;
    if (publishDate) {
      const y = parseInt(publishDate.slice(0, 4), 10);
      if (y >= 1900 && y <= 2100) meta.year = y;
    }

    return meta;
  } catch {
    return {};
  }
}

async function fetchViaHtmlScrape(videoId: string): Promise<YouTubeMeta> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999'
      },
    });
    if (!res.ok) return {};
    const html = await res.text();
    const meta: YouTubeMeta = {};

    const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
    if (lengthMatch) {
      const secs = parseInt(lengthMatch[1], 10);
      if (secs > 0) meta.duration = secs;
    }

    const descMatch = html.match(/"shortDescription"\s*:\s*"([^"]+)"/);
    if (descMatch) {
      meta.description = descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    const dateMatch = html.match(/"datePublished"\s*:\s*"(\d{4})/);
    if (dateMatch) {
      const y = parseInt(dateMatch[1], 10);
      if (y >= 1900 && y <= 2100) meta.year = y;
    } else {
      const uploadMatch = html.match(/"uploadDate"\s*:\s*"(\d{4})/);
      if (uploadMatch) {
        const y = parseInt(uploadMatch[1], 10);
        if (y >= 1900 && y <= 2100) meta.year = y;
      }
    }

    return meta;
  } catch {
    return {};
  }
}
