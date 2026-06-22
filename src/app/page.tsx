import { fetchStoriesServer } from '@/lib/serverData';
import HomeContent from '@/components/HomeContent';

export default async function HomePage() {
  const result = await fetchStoriesServer({
    sortBy: 'rating',
    page: 1,
    limit: 20,
  });

  return <HomeContent initialStories={result.stories} initialPagination={{ page: result.page, limit: 20, total: result.total, totalPages: result.totalPages }} />;
}
