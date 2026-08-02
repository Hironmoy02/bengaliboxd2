import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Collection from '@/models/Collection';
import mongoose from 'mongoose';
import { MONTHLY_PICKS } from '@/lib/explore-picks';
import ExploreContent from '@/components/ExploreContent';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore | Bengaliboxd',
  description: 'Curated monthly story picks and collections — handpicked Bengali audio stories to discover.',
};

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

export default async function ExplorePage() {
  await dbConnect();

  const now = new Date();
  const monthSeed = `${now.getFullYear()}-${now.getMonth() + 1}`;

  const allPinnedIds = MONTHLY_PICKS.flatMap((c) => c.pinnedIds);

  const allStories = await Story.find({ approved: true })
    .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount duration yearPublished')
    .lean();

  const curators = await Promise.all(
    MONTHLY_PICKS.map(async (curator) => {
      const pinnedObjectIds = curator.pinnedIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const pinnedStories = await Story.find({ _id: { $in: pinnedObjectIds } })
        .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount duration yearPublished')
        .lean();

      const pinnedMap = new Map(pinnedStories.map((s) => [s._id.toString(), s]));
      const orderedPinned = curator.pinnedIds
        .map((id) => pinnedMap.get(id))
        .filter(Boolean) as typeof allStories;

      const excludeSet = new Set(allPinnedIds);
      const pool = allStories.filter((s) => !excludeSet.has(s._id.toString()));

      const picked: typeof allStories = [];
      const tempPool = [...pool];
      let idx = 0;
      while (picked.length < curator.randomCount && tempPool.length > 0) {
        const rnd = monthlyRandom(curator.key + ':' + monthSeed, idx++) % tempPool.length;
        picked.push(tempPool[rnd]);
        tempPool.splice(rnd, 1);
      }

      return {
        ...curator,
        stories: JSON.parse(JSON.stringify([...orderedPinned, ...picked])),
      };
    })
  );

  const dbCollections = await Collection.find({})
    .select('name slug description gradient storyIds')
    .sort({ createdAt: -1 })
    .lean();

  const collections = await Promise.all(
    dbCollections.map(async (col) => {
      const storyObjectIds = (col.storyIds || [])
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const stories = storyObjectIds.length > 0
        ? await Story.find({ _id: { $in: storyObjectIds }, approved: true })
            .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount duration yearPublished')
            .lean()
        : [];

      return {
        _id: col._id.toString(),
        name: col.name,
        slug: col.slug,
        description: col.description,
        gradient: col.gradient,
        stories: JSON.parse(JSON.stringify(stories)),
      };
    })
  );

  return <ExploreContent curators={curators} collections={collections} />;
}
