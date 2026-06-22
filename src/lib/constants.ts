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

export const YEARS_RANGE = 21;

export const YOUTUBE_THUMBNAIL = (id: string, quality: 'hq' | 'maxres' = 'hq') =>
  `https://img.youtube.com/vi/${id}/${quality === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`;

export const ADMIN_TAB_LABELS = ['Analytics', 'Approvals', 'Users', 'Add Story', 'Edit Story', 'Settings'] as const;
