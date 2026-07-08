/**
 * Monthly curated picks config for the Explore page.
 * Update this each month to change Dev H's and Dev P's picks.
 * pinnedIds: story _id strings that are always included (guaranteed first).
 * randomCount: how many additional stories to fill in (month-seeded random).
 */

export interface CuratorConfig {
  key: string;
  name: string;
  initial: string;
  /** CSS gradient for the curator badge */
  gradient: string;
  /** Month label shown on the page */
  monthLabel: string;
  /** Short personal tagline */
  tagline: string;
  /** Story _id strings that are pinned/guaranteed */
  pinnedIds: string[];
  /** How many additional random stories to fill in */
  randomCount: number;
}

export const MONTHLY_PICKS: CuratorConfig[] = [
  {
    key: 'devH',
    name: "Dev H's Choice",
    initial: 'H',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    monthLabel: 'July 2026',
    tagline: 'Stories that left me speechless this month.',
    // The Count of Monte Cristo | Complete Story
    pinnedIds: ['6a393cc49401592cd5dffbcd'],
    randomCount: 4,
  },
  {
    key: 'devP',
    name: "Dev P's Choice",
    initial: 'P',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    monthLabel: 'July 2026',
    tagline: 'My picks for the long dark nights.',
    pinnedIds: [],
    randomCount: 5,
  },
];
