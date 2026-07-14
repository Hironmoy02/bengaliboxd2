interface YouTubeMeta {
  duration?: number;
  year?: number;
}

export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const result = await fetchViaInnerTube(videoId);
  if (result.duration || result.year) return result;
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
