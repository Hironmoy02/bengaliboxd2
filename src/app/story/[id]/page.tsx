import { notFound } from 'next/navigation';
import { fetchStoryByIdServer, fetchReviewsServer } from '@/lib/serverData';
import StoryContent from '@/components/StoryContent';

export const dynamic = 'force-dynamic';

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [story, reviewsResult] = await Promise.all([
    fetchStoryByIdServer(id),
    fetchReviewsServer(id, 1, 10),
  ]);

  if (!story) {
    notFound();
  }

  return (
    <StoryContent
      initialStory={story}
      initialReviews={reviewsResult.reviews}
      initialPagination={{ page: reviewsResult.page, limit: 10, total: reviewsResult.total, totalPages: reviewsResult.totalPages }}
    />
  );
}
