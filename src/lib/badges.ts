export interface BadgeDefinition {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
  category: 'listening' | 'community' | 'streak' | 'special';
  pointsBonus: number;
}

export interface LevelTier {
  level: number;
  nameEn: string;
  nameBn: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  {
    level: 1,
    nameEn: 'Novice Listener',
    nameBn: 'শ্রোতার আরম্ভ',
    minPoints: 0,
    maxPoints: 99,
    icon: '🥉',
    color: '#cd7f32',
  },
  {
    level: 2,
    nameEn: 'Story Enthusiast',
    nameBn: 'গল্প রসিক',
    minPoints: 100,
    maxPoints: 499,
    icon: '🥈',
    color: '#c0c0c0',
  },
  {
    level: 3,
    nameEn: 'Connoisseur',
    nameBn: 'কথা কবিদর',
    minPoints: 500,
    maxPoints: 1499,
    icon: '🥇',
    color: '#ffd700',
  },
  {
    level: 4,
    nameEn: 'Master Listener',
    nameBn: 'মহা শ্রোতা',
    minPoints: 1500,
    maxPoints: Infinity,
    icon: '💎',
    color: '#00e5ff',
  },
];

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_listen',
    titleEn: 'First Flame',
    titleBn: 'প্রথম শিখা',
    descriptionEn: 'Log your very first audio story listen',
    descriptionBn: 'আপনার প্রথম অডিও গল্প শোনার সূচনা',
    icon: '🎧',
    tier: 'bronze',
    category: 'listening',
    pointsBonus: 20,
  },
  {
    id: 'full_listen',
    titleEn: 'Full Story Listener',
    titleBn: 'সম্পূর্ণ গল্প শ্রোতা',
    descriptionEn: 'Listen to a full audio story to completion (+30 rosogolla)',
    descriptionBn: 'একটি সম্পূর্ণ অডিও গল্প শেষ পর্যন্ত শুনুন (+৩০ রসগোল্লা)',
    icon: '📻',
    tier: 'gold',
    category: 'listening',
    pointsBonus: 30,
  },
  {
    id: 'listen_5',
    titleEn: 'Story Collector',
    titleBn: 'গল্প সংগ্রাহক',
    descriptionEn: 'Listen to 5 different audio stories',
    descriptionBn: '৫টি ভিন্ন অডিও গল্প শুনুন',
    icon: '📚',
    tier: 'bronze',
    category: 'listening',
    pointsBonus: 30,
  },
  {
    id: 'listen_25',
    titleEn: 'Suspense Scholar',
    titleBn: 'সাসপেন্স পণ্ডিত',
    descriptionEn: 'Listen to 25 audio stories',
    descriptionBn: '২৫টি অডিও গল্প শুনুন',
    icon: '📻',
    tier: 'silver',
    category: 'listening',
    pointsBonus: 100,
  },
  {
    id: 'midnight_listener',
    titleEn: 'Midnight Listener',
    titleBn: 'রাতের শ্রোতা',
    descriptionEn: 'Listen to a story late at night (10 PM - 4 AM)',
    descriptionBn: 'রাত ১০টা থেকে ভোর ৪টার মধ্যে একটি গল্প শুনুন',
    icon: '🦉',
    tier: 'silver',
    category: 'listening',
    pointsBonus: 40,
  },
  {
    id: 'feluda_fan',
    titleEn: 'Feluda Fanatic',
    titleBn: 'ফেলুদা অনুরাগী',
    descriptionEn: 'Listen to or rate 3 Feluda / Satyajit Ray stories',
    descriptionBn: '৩টি ফেলুদা বা সত্যজিৎ রায়ের গল্প শুনুন বা রিভিউ দিন',
    icon: '🔎',
    tier: 'gold',
    category: 'listening',
    pointsBonus: 50,
  },
  {
    id: 'wordsmith',
    titleEn: 'Wordsmith',
    titleBn: 'শব্দশিল্পী',
    descriptionEn: 'Write a detailed review (>50 characters)',
    descriptionBn: '৫০ অক্ষরের বেশি বিস্তারিত রিভিউ লিখুন',
    icon: '🖋️',
    tier: 'bronze',
    category: 'community',
    pointsBonus: 25,
  },
  {
    id: 'critic_5',
    titleEn: 'Review Critic',
    titleBn: 'সমালোচক',
    descriptionEn: 'Write 5 detailed reviews for stories',
    descriptionBn: '৫টি গল্পের বিস্তারিত সমালোচনা প্রকাশ করুন',
    icon: '⭐',
    tier: 'silver',
    category: 'community',
    pointsBonus: 75,
  },
  {
    id: 'popular_review',
    titleEn: 'Popular Voice',
    titleBn: 'জনপ্রিয় কণ্ঠ',
    descriptionEn: 'Receive 3 likes on your reviews',
    descriptionBn: 'আপনার রিভিউতে ৩টি লাইক পান',
    icon: '❤️',
    tier: 'silver',
    category: 'community',
    pointsBonus: 50,
  },
  {
    id: 'streak_3',
    titleEn: 'Streak Spark',
    titleBn: 'শিখা স্পার্ক',
    descriptionEn: 'Maintain a 3-day active listening streak',
    descriptionBn: '৩ দিন টানা অডিও গল্প শোনার ধারাবাহিকতা বজায় রাখুন',
    icon: '🔥',
    tier: 'bronze',
    category: 'streak',
    pointsBonus: 30,
  },
  {
    id: 'streak_7',
    titleEn: 'Week Warrior',
    titleBn: 'সপ্তাহের যোদ্ধা',
    descriptionEn: 'Maintain a 7-day active listening streak',
    descriptionBn: '৭ দিন টানা ধারাবাহিকতা বজায় রাখুন',
    icon: '⚡',
    tier: 'silver',
    category: 'streak',
    pointsBonus: 70,
  },
  {
    id: 'streak_30',
    titleEn: 'Month Marathon',
    titleBn: 'মাসের ম্যারাথন',
    descriptionEn: 'Maintain a 30-day active listening streak',
    descriptionBn: '৩০ দিন টানা ধারাবাহিকতা বজায় রাখুন',
    icon: '🏆',
    tier: 'gold',
    category: 'streak',
    pointsBonus: 200,
  },
];

export function getLevelTier(points: number): LevelTier {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_TIERS[i].minPoints) {
      return LEVEL_TIERS[i];
    }
  }
  return LEVEL_TIERS[0];
}

export function getNextLevelTier(points: number): LevelTier | null {
  const currentTier = getLevelTier(points);
  const nextIndex = LEVEL_TIERS.findIndex((t) => t.level === currentTier.level) + 1;
  return nextIndex < LEVEL_TIERS.length ? LEVEL_TIERS[nextIndex] : null;
}
