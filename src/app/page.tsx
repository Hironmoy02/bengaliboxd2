import { fetchStoriesServer } from '@/lib/serverData';
import HomeContent from '@/components/HomeContent';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await dbConnect();

  const totalApproved = await Story.countDocuments({ approved: true });

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }

  let spotlightStories = [];
  if (totalApproved > 0) {
    const allStories = await Story.find({ approved: true })
      .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount description duration tags')
      .lean();
    if (allStories.length > 0) {
      const picked = [];
      const tempStories = [...allStories];
      let currentHash = Math.abs(hash);
      for (let j = 0; j < Math.min(5, allStories.length); j++) {
        const idx = Math.abs(currentHash) % tempStories.length;
        picked.push(tempStories[idx]);
        tempStories.splice(idx, 1);
        currentHash = (currentHash * 31 + 17) | 0;
      }
      spotlightStories = JSON.parse(JSON.stringify(picked));
    }
  }

  const result = await fetchStoriesServer({
    sortBy: 'rating',
    page: 1,
    limit: 20,
  });

  return (
    <HomeContent
      initialStories={result.stories}
      initialPagination={{
        page: result.page,
        limit: 20,
        total: result.total,
        totalPages: result.totalPages
      }}
      initialSpotlightStories={spotlightStories}
    />
  );
}
