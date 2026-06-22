import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';
import Rating from '@/models/Rating';
import { DEFAULT_PAGE_LIMIT } from '@/lib/constants';

interface StoryFilter {
  approved?: boolean;
  $or?: Array<Record<string, unknown>>;
  channel?: string;
  genre?: string;
  writer?: string;
  yearPublished?: number;
}

export async function fetchStoriesServer(params: {
  search?: string;
  channel?: string;
  genre?: string;
  writer?: string;
  year?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  await dbConnect();

  const {
    search = '',
    channel = '',
    genre = '',
    writer = '',
    year = '',
    sortBy = 'rating',
    page = 1,
    limit = DEFAULT_PAGE_LIMIT,
  } = params;

  const filter: StoryFilter = { approved: true };

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { narrator: { $regex: escaped, $options: 'i' } },
      { channel: { $regex: escaped, $options: 'i' } },
      { writer: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (channel && channel !== 'All') {
    filter.channel = channel;
  }

  if (genre && genre !== 'All') {
    filter.genre = genre;
  }

  if (writer && writer !== 'All') {
    filter.writer = writer;
  }

  if (year && year !== 'All') {
    filter.yearPublished = parseInt(year, 10);
  }

  let sort: Record<string, 1 | -1> = {};
  if (sortBy === 'newest') {
    sort = { createdAt: -1 };
  } else if (sortBy === 'reviews') {
    sort = { ratingsCount: -1, averageRating: -1 };
  } else {
    sort = { averageRating: -1, ratingsCount: -1 };
  }

  const skip = (page - 1) * limit;

  const [stories, total] = await Promise.all([
    Story.find(filter).sort(sort).populate('addedBy', 'username').skip(skip).limit(limit).lean(),
    Story.countDocuments(filter),
  ]);

  return {
    stories: JSON.parse(JSON.stringify(stories)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function fetchStoryByIdServer(id: string) {
  await dbConnect();
  const story = await Story.findById(id).populate('addedBy', 'username').lean();
  if (!story) return null;
  return JSON.parse(JSON.stringify(story));
}

export async function fetchReviewsServer(storyId: string, page = 1, limit = DEFAULT_PAGE_LIMIT) {
  await dbConnect();

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Rating.find({ storyId })
      .populate('userId', 'username')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Rating.countDocuments({ storyId }),
  ]);

  return {
    reviews: JSON.parse(JSON.stringify(reviews)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
