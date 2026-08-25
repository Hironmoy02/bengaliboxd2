import { COMMON_WRITERS } from '@/lib/youtube-meta';

/**
 * Utility to clean raw YouTube titles into short, elegant, proper story titles.
 */

export function smartCleanTitle(rawTitle: string, writer: string = '', description: string = ''): string {
  if (!rawTitle) return '';

  let t = rawTitle;

  // 1. Decode HTML entities
  t = t.replace(/&amp;/g, '&')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>');

  // 2. Remove Hashtags & Episode Suffixes
  t = t.replace(/#\w+/g, '');
  t = t.replace(/\bEP\s*\d+\b/gi, '');
  t = t.replace(/\bEpisode\s*\d+\b/gi, '');
  t = t.replace(/\bSeason\s*\d+\b/gi, '');

  // 3. Remove common channel/brand/category labels
  const noisePatterns = [
    /\bSunday\s*Suspense\s*Classics\b/gi,
    /\bSunday\s*Suspense\s*Originals\b/gi,
    /\bSunday\s*Suspense\b/gi,
    /\bSundaySuspense\b/gi,
    /\bGoppo\s*Mir\s*er\s*Thek\b/gi,
    /\bGoppoMirerThek\b/gi,
    /\bGoppo\s*Mirer\s*Thek\b/gi,
    /\bGMT\s*Originals\b/gi,
    /\bGMT\s*Shorts\b/gi,
    /\bGMTShorts\b/gi,
    /\bGMT\b/gi,
    /\bMidnight\s*Horror\s*Station\b/gi,
    /\bMidnightHorrorStation\b/gi,
    /\bMHS\b/gi,
    /\bKahon\b/gi,
    /\bMirchi\s*Bangla\s*Originals\b/gi,
    /\bMirchi\s*Bangla\b/gi,
    /\bMirchi\s*Bang\b/gi,
    /\bMirchi\b/gi,
    /\bRadio\s*Mirchi\b/gi,
    /\bFriday\s*Classics\b/gi,
    /\bFridayClassics\b/gi,
    /\bWorld\s*Classics\b/gi,
    /\bBangla\s*Audio\s*Story\b/gi,
    /\bBengali\s*Audio\s*Story\b/gi,
    /\bBengali\s*Audio\s*Drama\b/gi,
    /\bBangla\s*Crime\s*Thriller\s*Story\b/gi,
    /\bBangla\s*Crime\s*Thriller\b/gi,
    /\bAudio\s*Drama\s*Originals\b/gi,
    /\bAudio\s*Drama\b/gi,
    /\bAudio\s*Jukebox\b/gi,
    /\bAudio\s*Story\b/gi,
    /\bGhost\s*Stories\b/gi,
    /\bCrime\s*Stories\b/gi,
    /\bFull\s*Story\b/gi,
    /\bMaha\s*Episode\b/gi,
    /\bHaar\s*Heem\s*Horror\b/gi,
    /\bChanakya\s*Series\b/gi,
    /\bClassics\b/gi,
    /\bOriginals\b/gi,
    /\bArabian\s*Nights\b/gi
  ];

  for (const p of noisePatterns) {
    t = t.replace(p, '');
  }

  // Helper to check if a segment matches any writer name or alias
  const isWriterSegment = (seg: string): boolean => {
    const sTrimmed = seg.trim().toLowerCase();
    if (!sTrimmed) return false;
    if (writer && sTrimmed.includes(writer.toLowerCase())) return true;
    for (const w of COMMON_WRITERS) {
      for (const alias of w.aliases) {
        if (sTrimmed === alias.toLowerCase() || sTrimmed.includes(alias.toLowerCase())) {
          return true;
        }
      }
    }
    return false;
  };

  // 4. Split by '|' or ',' and filter out segments that only contain cast, author, channel, series prefix, or noise
  if (t.includes('|')) {
    const segments = t.split('|').map(s => s.trim()).filter(Boolean);

    // First pass: if the very first segment is "Story Name By Writer", extract just the story name part.
    // e.g. "Puimacha By Bibhutibhushan Bandopadhyay" → "Puimacha"
    const byWriterMatch = segments[0]?.match(/^(.+?)\s+[Bb]y\s+[A-Za-z\s\u0980-\u09ff]+$/);
    if (byWriterMatch) {
      segments[0] = byWriterMatch[1].trim();
    }

    // Series name patterns — segments that are just the series identifier.
    // When we encounter one, we should SKIP it but preserve the next non-noise segment.
    const SERIES_ONLY_RE = /^(?:Feluda|Tarini\s*Khuro|Tarinikhuro|Sherlock\s*Holmes|Byomkesh\s*Bakshi|ব্যোমকেশ\s*বক্সী|Daroga)$/i;

    // Cast/narrator-only segments to silently drop
    const CAST_ONLY_RE = /^(?:Mir|Deep|Somak|Godhuli|Papiya|Roy|Agni|Pushpal|Anujoy|Sree|Richard|Sudip|Kaizar|Buddhadev|Sankari|Rounak|Shovan|Rituparna|Maitrayee|Shakya|Aikayan|Anirban Bhattacharya|Pradyut Chatterjea|Srijan Chatterjee|Complete Story)$/i;
    const CAST_COMPOUND_RE = /^(?:Mir\s+Afsar\s+Ali|Deep\s+Kaizar(?:\s+Basu)?|Godhuli\s+\w+|Papiya\s+\w+|Somak\s+\w+|Sudip\s+Kaizar|Shovan\s+\w+|Rounak\s+\w+)$/i;
    const CHANNEL_RE = /^(?:Sunday Suspense|Goppo Mirer Thek|Goppo Mir er Thek|Mirchi Bangla|Mirchi Bang|Mirchi|Midnight Horror Station|Kahon|Friday Classics|World Classics|GMT|Audio Story)$/i;

    // Build clean segment list: skip series/cast/channel labels but keep story names that follow them
    const cleanSegments: string[] = [];
    for (const seg of segments) {
      if (SERIES_ONLY_RE.test(seg)) continue;   // series label — drop, keep going
      if (CAST_ONLY_RE.test(seg)) continue;     // narrator name — drop
      if (CAST_COMPOUND_RE.test(seg)) continue; // compound narrator — drop
      if (CHANNEL_RE.test(seg)) continue;       // channel brand — drop
      if (isWriterSegment(seg)) continue;       // writer name — drop
      cleanSegments.push(seg);
    }

    if (cleanSegments.length > 0) {
      t = cleanSegments[0]; // Take primary story name
    }
  }


  // 4b. Strip series prefix names e.g. "Feluda - ", "Tarini Khuro - ", "Sherlock Holmes - ", "Byomkesh Bakshi - "
  t = t.replace(/^(?:Feluda|Tarini\s*Khuro|Tarinikhuro|Sherlock\s*Holmes|Byomkesh\s*Bakshi|ব্যোমকেশ\s*বক্সী|Daroga)\s*[-–—:]\s*/gi, '');

  // 5. Remove "By [Writer]" or "By [Author]"
  t = t.replace(/\bby\s+[A-Za-z\s\u0980-\u09ff]+/gi, '');

  // 6. Remove trailing artist / cast / author names
  const crewNames = [
    'Anirban Bhattacharya', 'Pradyut Chatterjea', 'Srijan Chatterjee', 'Ayantika Shamik',
    'Sudip Kaizar Sumit', 'Rituparna Rounak Maitrayee', 'Shovan Dipankar', 'Shovan Rounak Shakya',
    'Afsar Ali Shovan Arpan Dipam', 'Shovan', 'Rounak', 'Shakya', 'Dipankar', 'Maitrayee',
    'Rituparna', 'Afsar Ali', 'Arpan', 'Dipam', 'Sudip', 'Kaizar', 'Sumit', 'Aikayan', 'Sudipta',
    'Victor Hugo World', 'Victor Hugo'
  ];

  for (const c of crewNames) {
    const reg = new RegExp(`\\b${c}\\b`, 'gi');
    t = t.replace(reg, '');
  }

  if (writer) {
    const escWriter = writer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\b${escWriter}\\b`, 'gi'), '');
  }

  // 7. Clean up parenthetical noise (keep useful ones like "(নিষ্কৃতি)" or "(উত্তরবঙ্গ সরগরম)")
  t = t.replace(/\((?:Friday Classics|World Classics|Mirchi Bangla|Goppo Mirer Thek|Sunday Suspense|Banglay Biswasera)\)/gi, '');
  t = t.replace(/\(\s*\)/g, ''); // Empty parentheses

  // 8. Clean up extra symbols, dashes, & whitespace
  t = t.replace(/\|/g, ' ');
  t = t.replace(/[-–—:_,\s]+$/g, '');
  t = t.replace(/^[-–—:_,\s]+/g, '');
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}
