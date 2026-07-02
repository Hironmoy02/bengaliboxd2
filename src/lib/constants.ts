export const CHANNELS = [
  'Sunday Suspense',
  'Goppo Mirer Thek',
  'Midnight Horror Station',
  'Kahon',
  'Other Bengali Channels',
] as const;

export const CHANNEL_KEYWORDS: Record<string, string[]> = {
  'Sunday Suspense': ['suspense', 'mirchi'],
  'Goppo Mirer Thek': ['thek', 'mir afsar'],
  'Midnight Horror Station': ['midnight', 'station'],
  'Kahon': ['kahon'],
};

export function matchYouTubeChannel(youtubeChannelName: string): string | null {
  const lower = youtubeChannelName.toLowerCase();
  for (const [channel, keywords] of Object.entries(CHANNEL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return channel;
    }
  }
  return null;
}

export const GENRES = [
  'Horror',
  'Mystery',
  'Thriller',
  'Drama',
  'Comedy',
  'Classic',
  'Adventure',
] as const;

export const DEFAULT_GENRE = 'Horror';
export const DEFAULT_CHANNEL = 'Sunday Suspense';

export const NARRATOR_KEYWORDS: Record<string, string> = {
  somak: 'Somak',
  mir: 'Mir',
  deep: 'Deep',
  sayak: 'Sayak',
  jojo: 'Jojo',
};

export const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'newest', label: 'Newest Added' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const YOUTUBE_THUMBNAIL = (id: string, quality: 'hq' | 'maxres' = 'hq') =>
  `https://img.youtube.com/vi/${id}/${quality === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`;

export const SUGGESTED_TAGS = [
  'Village', 'Urban', 'Detective', 'Ghost', 'Psychological', 'Supernatural', 'Mythological',
  'Social', 'Emotional', 'Suspense', 'Twist End', 'Period', 'Thriller',
  'Children', 'Romance', 'Satire', 'Folklore', 'Noir', 'Dark', 'Historical',
  'Train', 'Night', 'Rain', 'Lonely', 'Revenge', 'Mystery',
] as const;

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const ADMIN_TAB_LABELS = ['Analytics', 'Approvals', 'Users', 'Add Story', 'Edit Story', 'Bulk Upload', 'Settings', 'Feedback'] as const;
