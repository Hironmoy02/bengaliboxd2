import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeContent from '@/components/HomeContent';

jest.mock('next/link', () => {
  return React.forwardRef(function MockLink({ children, href, ...props }: Record<string, unknown>, ref: React.Ref<HTMLAnchorElement>) {
    return <a ref={ref} href={href as string} {...props}>{children}</a>;
  });
});

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

const mockStories = [
  {
    _id: '1',
    title: 'Test Story',
    channel: 'Sunday Suspense',
    narrator: 'Somak',
    genre: 'Horror',
    youtubeId: 'abc123def45',
    thumbnailUrl: '',
    averageRating: 4.5,
    ratingsCount: 10,
    description: 'A test story',
  },
  {
    _id: '2',
    title: 'Another Story',
    channel: 'Kahon',
    narrator: 'Mir',
    genre: 'Mystery',
    youtubeId: 'xyz789abc12',
    thumbnailUrl: '',
    averageRating: 3.8,
    ratingsCount: 5,
    description: 'Another test story',
  },
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
};

describe('HomeContent', () => {
  it('renders the hero section with spotlight story', () => {
    render(<HomeContent initialStories={mockStories} initialPagination={mockPagination} />);
    expect(screen.getByText('Spotlight Story')).toBeInTheDocument();
    expect(screen.getAllByText('Test Story').length).toBeGreaterThanOrEqual(1);
  });

  it('renders story cards', () => {
    render(<HomeContent initialStories={mockStories} initialPagination={mockPagination} />);
    expect(screen.getAllByText('Test Story').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Another Story')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<HomeContent initialStories={mockStories} initialPagination={mockPagination} />);
    expect(screen.getByPlaceholderText(/Search by story title/)).toBeInTheDocument();
  });

  it('renders channel tabs', () => {
    render(<HomeContent initialStories={mockStories} initialPagination={mockPagination} />);
    expect(screen.getByText('All Channels')).toBeInTheDocument();
    expect(screen.getAllByText('Sunday Suspense').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Kahon').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render pagination when total pages is 1', () => {
    render(<HomeContent initialStories={mockStories} initialPagination={mockPagination} />);
    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument();
  });

  it('renders empty state when no stories', () => {
    render(<HomeContent initialStories={[]} initialPagination={{ ...mockPagination, total: 0, totalPages: 0 }} />);
    expect(screen.getByText('No audio stories match your criteria')).toBeInTheDocument();
  });

  it('renders pagination when totalPages > 1', () => {
    const paginatedPagination = { page: 1, limit: 20, total: 40, totalPages: 2 };
    render(<HomeContent initialStories={mockStories} initialPagination={paginatedPagination} />);
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });
});
