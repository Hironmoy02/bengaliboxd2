import dbConnect from '@/lib/dbConnect';
import Collection from '@/models/Collection';
import Story from '@/models/Story';
import CollectionPageContent from '@/components/CollectionPageContent';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const collection = await Collection.findOne({ slug }).lean();
  if (!collection) return { title: 'Not Found | Bengaliboxd' };

  return {
    title: `${collection.name} | Bengaliboxd`,
    description: collection.description || `Browse stories in the ${collection.name} collection.`,
  };
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await dbConnect();

  const collection = await Collection.findOne({ slug }).lean();
  if (!collection) notFound();

  const storyIds = (collection.storyIds || []).filter((id) => id);
  const stories = storyIds.length > 0
    ? await Story.find({ _id: { $in: storyIds }, approved: true })
        .select('_id title channel narrator genre writer youtubeId thumbnailUrl averageRating ratingsCount duration yearPublished tags')
        .lean()
    : [];

  const orderedStories = storyIds.map((id) =>
    stories.find((s) => s._id.toString() === id.toString())
  ).filter(Boolean);

  return (
    <CollectionPageContent
      collection={{
        _id: collection._id.toString(),
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        gradient: collection.gradient,
      }}
      stories={JSON.parse(JSON.stringify(orderedStories))}
    />
  );
}
