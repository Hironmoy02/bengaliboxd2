import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Listen from '@/models/Listen';
import Rating from '@/models/Rating';
import Like from '@/models/Like';
import Story from '@/models/Story';
import { BADGES, getLevelTier, getNextLevelTier, BadgeDefinition } from './badges';

function getUtcDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function isYesterday(lastDateStr: string, currentDateStr: string): boolean {
  const last = new Date(lastDateStr);
  const current = new Date(currentDateStr);
  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  return diffDays === 1;
}

export async function processUserGamificationAction(
  userId: string,
  actionType: 'LISTEN' | 'REVIEW' | 'LIKE_RECEIVED' | 'STORY_ADDED' | 'FULL_LISTEN',
  context?: {
    storyId?: string;
    reviewLength?: number;
    storyTitle?: string;
    storyWriter?: string;
  }
) {
  await dbConnect();

  const user = await User.findById(userId);
  if (!user) return null;

  // Initialize defaults if missing
  if (!user.streak) {
    user.streak = { current: 0, longest: 0, lastActiveDate: null };
  }
  if (typeof user.karmaPoints !== 'number') {
    user.karmaPoints = 0;
  }
  if (!user.badges) {
    user.badges = [] as any;
  }

  const todayStr = getUtcDateString();
  const lastActiveStr = user.streak.lastActiveDate;

  // 1. Update Streak for activity actions (LISTEN, REVIEW, or FULL_LISTEN)
  if (actionType === 'LISTEN' || actionType === 'REVIEW' || actionType === 'FULL_LISTEN') {
    if (!lastActiveStr) {
      user.streak.current = 1;
      user.streak.longest = 1;
      user.streak.lastActiveDate = todayStr;
    } else if (lastActiveStr === todayStr) {
      // Same day activity, streak stays unchanged
    } else if (isYesterday(lastActiveStr, todayStr)) {
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
      user.streak.lastActiveDate = todayStr;
    } else {
      // Streak broken
      user.streak.current = 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
      user.streak.lastActiveDate = todayStr;
    }
  }

  // 2. Base Karma Points
  let basePoints = 0;
  if (actionType === 'LISTEN') basePoints = 10;
  else if (actionType === 'FULL_LISTEN') basePoints = 30;
  else if (actionType === 'REVIEW') {
    basePoints = 15;
    if (context?.reviewLength && context.reviewLength >= 50) {
      basePoints += 15; // Bonus for detailed review
    }
  } else if (actionType === 'LIKE_RECEIVED') basePoints = 15;
  else if (actionType === 'STORY_ADDED') basePoints = 20;

  user.karmaPoints += basePoints;

  // 3. Evaluate Badges
  const existingBadgeIds = new Set(user.badges.map((b: { badgeId: string }) => b.badgeId));
  const newlyUnlockedBadges: BadgeDefinition[] = [];

  // Fetch counts for criteria checks
  const totalListens = await Listen.countDocuments({ userId });
  const ratingsWithReviews = await Rating.countDocuments({ userId, reviewText: { $exists: true, $ne: '' } });

  // Midnight check
  const currentHour = new Date().getHours();
  const isMidnight = currentHour >= 22 || currentHour < 4;

  // Feluda / Satyajit Ray check
  let isFeludaStory = false;
  if (context?.storyTitle || context?.storyWriter) {
    const text = `${context?.storyTitle || ''} ${context?.storyWriter || ''}`.toLowerCase();
    if (text.includes('feluda') || text.includes('satyajit') || text.includes('ray') || text.includes('byomkesh')) {
      isFeludaStory = true;
    }
  }

  for (const badge of BADGES) {
    if (existingBadgeIds.has(badge.id)) continue;

    let unlocked = false;

    switch (badge.id) {
      case 'first_listen':
        if (totalListens >= 1 || actionType === 'LISTEN' || actionType === 'FULL_LISTEN') unlocked = true;
        break;
      case 'full_listen':
        if (actionType === 'FULL_LISTEN') unlocked = true;
        break;
      case 'listen_5':
        if (totalListens >= 5) unlocked = true;
        break;
      case 'listen_25':
        if (totalListens >= 25) unlocked = true;
        break;
      case 'midnight_listener':
        if (actionType === 'LISTEN' && isMidnight) unlocked = true;
        break;
      case 'feluda_fan':
        if (isFeludaStory) unlocked = true;
        break;
      case 'wordsmith':
        if (actionType === 'REVIEW' && (context?.reviewLength || 0) >= 50) unlocked = true;
        break;
      case 'critic_5':
        if (ratingsWithReviews >= 5) unlocked = true;
        break;
      case 'streak_3':
        if (user.streak.current >= 3) unlocked = true;
        break;
      case 'streak_7':
        if (user.streak.current >= 7) unlocked = true;
        break;
      case 'streak_30':
        if (user.streak.current >= 30) unlocked = true;
        break;
      default:
        break;
    }

    if (unlocked) {
      newlyUnlockedBadges.push(badge);
      user.badges.push({ badgeId: badge.id, unlockedAt: new Date() });
      user.karmaPoints += badge.pointsBonus;
    }
  }

  await user.save();

  return {
    streak: user.streak,
    karmaPoints: user.karmaPoints,
    newlyUnlockedBadges,
    currentLevel: getLevelTier(user.karmaPoints),
  };
}

export async function syncUserGamification(userId: string) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return null;

  // Initialize defaults if missing
  if (!user.streak) {
    user.streak = { current: 0, longest: 0, lastActiveDate: null };
  }

  const totalListens = await Listen.countDocuments({ userId });
  const ratings = await Rating.find({ userId }).lean();
  const storiesAddedCount = await Story.countDocuments({ addedBy: userId });
  const likesCount = await Like.countDocuments({ userId });

  let basePoints = 0;
  basePoints += totalListens * 10;

  let reviewsWithDetailedText = 0;
  let ratingsWithReviewsCount = 0;
  ratings.forEach((r) => {
    basePoints += 15;
    if (r.reviewText && r.reviewText.trim().length > 0) {
      ratingsWithReviewsCount++;
    }
    if (r.reviewText && r.reviewText.trim().length >= 50) {
      basePoints += 15;
      reviewsWithDetailedText++;
    }
  });

  basePoints += storiesAddedCount * 20;
  basePoints += likesCount * 15;

  // Map existing badges
  const existingBadgesMap = new Map<string, Date>();
  if (user.badges && Array.isArray(user.badges)) {
    user.badges.forEach((b: { badgeId: string; unlockedAt: Date }) => {
      existingBadgesMap.set(b.badgeId, b.unlockedAt || new Date());
    });
  }

  const currentStreak = user.streak?.current || 0;

  // Evaluate badge eligibility
  for (const badge of BADGES) {
    let shouldUnlock = false;

    switch (badge.id) {
      case 'first_listen':
        if (totalListens >= 1) shouldUnlock = true;
        break;
      case 'listen_5':
        if (totalListens >= 5) shouldUnlock = true;
        break;
      case 'listen_25':
        if (totalListens >= 25) shouldUnlock = true;
        break;
      case 'wordsmith':
        if (reviewsWithDetailedText >= 1) shouldUnlock = true;
        break;
      case 'critic_5':
        if (ratingsWithReviewsCount >= 5) shouldUnlock = true;
        break;
      case 'streak_3':
        if (currentStreak >= 3) shouldUnlock = true;
        break;
      case 'streak_7':
        if (currentStreak >= 7) shouldUnlock = true;
        break;
      case 'streak_30':
        if (currentStreak >= 30) shouldUnlock = true;
        break;
      default:
        break;
    }

    if (shouldUnlock && !existingBadgesMap.has(badge.id)) {
      existingBadgesMap.set(badge.id, new Date());
    }
  }

  // Compute total badge point bonuses
  let badgeBonusTotal = 0;
  const updatedBadges: { badgeId: string; unlockedAt: Date }[] = [];
  existingBadgesMap.forEach((unlockedAt, badgeId) => {
    const badgeDef = BADGES.find((b) => b.id === badgeId);
    if (badgeDef) {
      badgeBonusTotal += badgeDef.pointsBonus;
    }
    updatedBadges.push({ badgeId, unlockedAt });
  });

  const finalCalculatedPoints = basePoints + badgeBonusTotal;

  let needsSave = false;
  if (typeof user.karmaPoints !== 'number' || user.karmaPoints < finalCalculatedPoints) {
    user.karmaPoints = finalCalculatedPoints;
    needsSave = true;
  }

  if (updatedBadges.length > (user.badges?.length || 0)) {
    user.badges = updatedBadges as any;
    needsSave = true;
  }

  if (needsSave) {
    await user.save();
  }

  return user;
}

export async function getUserGamificationProfile(userId: string) {
  await dbConnect();

  // Auto-sync gamification points & badges from actual user activity in DB
  await syncUserGamification(userId);

  const user = await User.findById(userId).lean();
  if (!user) return null;

  const streak = user.streak || { current: 0, longest: 0, lastActiveDate: null };
  const karmaPoints = user.karmaPoints || 0;
  const rawBadges = user.badges || [];

  const unlockedMap = new Map<string, Date>();
  rawBadges.forEach((b: { badgeId: string; unlockedAt: Date }) => {
    unlockedMap.set(b.badgeId, b.unlockedAt);
  });

  const currentLevel = getLevelTier(karmaPoints);
  const nextLevel = getNextLevelTier(karmaPoints);

  let progressPercent = 100;
  if (nextLevel) {
    const range = nextLevel.minPoints - currentLevel.minPoints;
    const gained = karmaPoints - currentLevel.minPoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
  }

  const allBadgesFormatted = BADGES.map((b) => {
    const isUnlocked = unlockedMap.has(b.id);
    return {
      ...b,
      isUnlocked,
      unlockedAt: isUnlocked ? unlockedMap.get(b.id) : null,
    };
  });

  return {
    streak,
    karmaPoints,
    currentLevel,
    nextLevel,
    progressPercent,
    badges: allBadgesFormatted,
    unlockedCount: rawBadges.length,
    totalBadgesCount: BADGES.length,
  };
}

