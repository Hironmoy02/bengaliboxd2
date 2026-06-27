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
  const index = totalApproved > 0 ? Math.abs(hash) % totalApproved : 0;

  let spotlightStory = null;
  if (totalApproved > 0) {
    const spotlightStoryDoc = await Story.findOne({ approved: true })
      .skip(index)
      .populate('addedBy', 'username')
      .lean();
    if (spotlightStoryDoc) {
      spotlightStory = JSON.parse(JSON.stringify(spotlightStoryDoc));
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
      initialSpotlightStory={spotlightStory}
    />
  );
}
