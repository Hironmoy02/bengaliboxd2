import '@/lib/polyfill';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import { MONTHLY_PICKS } from '@/lib/explore-picks';

export const dynamic = 'force-dynamic';

/** Deterministic pseudo-random seeded by YYYY-MM string */
function monthlyRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + ':' + index;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const monthSeed = `${now.getFullYear()}-${now.getMonth() + 1}`;

    // Collect all pinned IDs across all curators so we exclude them from random pools
    const allPinnedIds = MONTHLY_PICKS.flatMap((c) => c.pinnedIds);

    // Fetch all approved stories (excluding nothing from pinned — we fetch pinned separately)
    const allStories = await Story.find({ approved: true })
      .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount duration yearPublished')
      .lean();

    const result: Record<string, { config: (typeof MONTHLY_PICKS)[0]; stories: typeof allStories }> = {};

    for (const curator of MONTHLY_PICKS) {
      // 1. Fetch pinned stories by ID (preserve order)
      const pinnedObjectIds = curator.pinnedIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const pinnedStories = await Story.find({ _id: { $in: pinnedObjectIds } })
        .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount duration yearPublished')
        .lean();

      // Sort pinned to match the pinnedIds order
      const pinnedMap = new Map(pinnedStories.map((s) => [s._id.toString(), s]));
      const orderedPinned = curator.pinnedIds
        .map((id) => pinnedMap.get(id))
        .filter(Boolean) as typeof allStories;

      // 2. Build random pool: exclude all pinned IDs of this curator + all other curators' pinned
      const excludeSet = new Set(allPinnedIds);
      const pool = allStories.filter((s) => !excludeSet.has(s._id.toString()));

      // 3. Deterministically pick `randomCount` from pool using monthly seed
      const picked: typeof allStories = [];
      const tempPool = [...pool];
      let idx = 0;
      while (picked.length < curator.randomCount && tempPool.length > 0) {
        const rnd = monthlyRandom(curator.key + ':' + monthSeed, idx++) % tempPool.length;
        picked.push(tempPool[rnd]);
        tempPool.splice(rnd, 1);
      }

      result[curator.key] = {
        config: curator,
        stories: [...orderedPinned, ...picked],
      };
    }

    return NextResponse.json({
      monthSeed,
      curators: MONTHLY_PICKS.map((c) => ({
        ...c,
        stories: result[c.key]?.stories ?? [],
      })),
    });
  } catch (error) {
    console.error('Explore API error:', error);
    return NextResponse.json({ error: 'Failed to load explore picks' }, { status: 500 });
  }
}
