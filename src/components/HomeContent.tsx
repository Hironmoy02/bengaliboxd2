'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAppSelector } from '@/lib/hooks';
import {
  Box, Typography, Button, TextField, InputAdornment, Tabs, Tab, Paper, Stack, Chip,
  Autocomplete,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import {
  AppPagination, AppSortSelect, AppStoryCard, AppEmptyState, AppRatingDisplay, AppLoadingState,
  AppSelect,
} from '@/components/ui';
import { CHANNELS, GENRES, YEARS_RANGE, DEFAULT_PAGE_LIMIT, type SortValue } from '@/lib/constants';

interface Story {
  _id: string;
  title: string;
  channel: string;
  narrator: string;
  genre: string;
  writer?: string;
  youtubeId: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingsCount: number;
  description?: string;
  duration?: number;
  tags?: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface HomeContentProps {
  initialStories: Story[];
  initialPagination: Pagination;
  initialSpotlightStories?: Story[];
}

export default function HomeContent({ initialStories, initialPagination, initialSpotlightStories = [] }: HomeContentProps) {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('All');
  const [genre, setGenre] = useState('All');
  const [writer, setWriter] = useState('All');
  const [writers, setWriters] = useState<{ name: string }[]>([]);
  const [year, setYear] = useState('All');
  const [sortBy, setSortBy] = useState<SortValue>('rating');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isInitialMount = useRef(true);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [listenIds, setListenIds] = useState<Set<string>>(new Set());
  const { user } = useAppSelector((s) => s.auth);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [openWriter, setOpenWriter] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  useEffect(() => {
    if (!openWriter) return;
    const handleScroll = () => setOpenWriter(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [openWriter]);

  useEffect(() => {
    if (!openYear) return;
    const handleScroll = () => setOpenYear(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [openYear]);

  useEffect(() => {
    if (!openSort) return;
    const handleScroll = () => setOpenSort(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [openSort]);

  useEffect(() => {
    const count = initialSpotlightStories?.length || 0;
    if (count <= 1) return;
    const timer = setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % count);
    }, 3000);
    return () => clearInterval(timer);
  }, [initialSpotlightStories]);

  useEffect(() => { api.post('/api/stats/visit').catch(() => {}); }, []);

  useEffect(() => {
    api.get('/api/writers').then(({ data }) => setWriters(data.writers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/api/bookmarks/ids').then(({ data }) => {
      setBookmarkIds(new Set(data.bookmarkIds || []));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/api/listens/ids').then(({ data }) => {
        setListenIds(new Set(data.listenIds || []));
      }).catch(() => {});
    }
  }, [user]);

  const yearsList = ['All', ...Array.from({ length: YEARS_RANGE }, (_, i) => String(new Date().getFullYear() - i))];

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStories = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/stories', {
        params: { search: debouncedSearch, channel, genre, writer: writer === 'All' ? '' : writer, year: year === 'All' ? '' : year, sortBy, page, limit: DEFAULT_PAGE_LIMIT },
      });
      setStories(data.stories || []);
      setPagination(data.pagination || { page: 1, limit: DEFAULT_PAGE_LIMIT, total: 0, totalPages: 0 });
    } catch { console.error('Error fetching stories'); }
    finally { setLoading(false); }
  }, [debouncedSearch, channel, genre, writer, year, sortBy]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    fetchStories(currentPage);
  }, [fetchStories, currentPage]);

  const featuredStory = initialSpotlightStories.length > 0 ? initialSpotlightStories[spotlightIdx] : null;

  const channelsList = ['All', ...CHANNELS];
  const genresList = ['All', ...GENRES];

  const toggleBookmark = async (storyId: string) => {
    const isCurrentlyBookmarked = bookmarkIds.has(storyId);
    try {
      if (isCurrentlyBookmarked) {
        await api.delete('/api/bookmarks', { data: { storyId } });
        setBookmarkIds((prev) => { const next = new Set(prev); next.delete(storyId); return next; });
      } else {
        await api.post('/api/bookmarks', { storyId });
        setBookmarkIds((prev) => new Set(prev).add(storyId));
      }
    } catch { /* ignore */ }
  };

  return (
    <div>
      {/* Hero Section */}
      <Box sx={{ background: 'linear-gradient(135deg, rgba(255,94,43,0.08) 0%, rgba(167,139,250,0.06) 100%)', py: { xs: 6, md: 10 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <div className="container">
          {featuredStory ? (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={5} sx={{ alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Chip icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />} label="Spotlight Story" color="primary" size="small" sx={{ mb: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.8rem' }, lineHeight: 1.15, mb: 2 }}>
                  {featuredStory.title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                  Narrated by <strong style={{ color: 'var(--text-primary)' }}>{featuredStory.narrator}</strong> on{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{featuredStory.channel}</span>.
                  {featuredStory.description && ` ${featuredStory.description.slice(0, 180)}...`}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                  <AppRatingDisplay rating={featuredStory.averageRating} count={featuredStory.ratingsCount} size={16} />
                  <Chip label={featuredStory.genre} size="small" variant="outlined" />
                  {featuredStory.writer && <Typography variant="body2" color="text.secondary">Written by {featuredStory.writer}</Typography>}
                </Stack>
                <Button component={Link} href={`/story/${featuredStory._id}`} variant="contained" size="large" startIcon={<span className="material-icons" />}>
                  Listen & Review
                </Button>
              </Box>
              <Paper sx={{ width: { xs: '100%', md: 340 }, height: { xs: 200, md: 260 }, borderRadius: 3, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <img src={featuredStory.thumbnailUrl || `https://img.youtube.com/vi/${featuredStory.youtubeId}/maxresdefault.jpg`} alt={featuredStory.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Paper>
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.8rem' }, mb: 2 }}>
                The Bengali Audio Story Journal
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                A community-driven platform to search, rate, and review Bengali audio stories.
              </Typography>
              <Button component={Link} href="/admin" variant="contained" size="large" startIcon={<AddCircleOutlinedIcon />}>
                Add Your First Story
              </Button>
            </Box>
          )}
        </div>
      </Box>

      {/* Filters + Grid */}
      <Box sx={{ py: 8 }}>
        <div className="container">

          {/* Search + Sort */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
            <TextField
              fullWidth
              placeholder="Search by title, author, narrator, genre, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ maxWidth: { xs: '100%', sm: 400 } }}
            />
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <AppSortSelect
                value={sortBy}
                onChange={setSortBy}
                open={openSort}
                onOpen={() => setOpenSort(true)}
                onClose={() => setOpenSort(false)}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              />
            </Stack>
          </Stack>

          {/* Genre + Writer Filters */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            {genresList.map((g) => (
              <Chip key={g} label={g === 'All' ? 'All Genres' : g} size="small" variant={genre === g ? 'filled' : 'outlined'} color={genre === g ? 'primary' : 'default'} onClick={() => { setGenre(g); setCurrentPage(1); }}
                sx={{ borderColor: genre === g ? undefined : 'divider', '&:hover': { borderColor: 'text.disabled' } }}
              />
            ))}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 1, alignItems: { sm: 'center' } }}>
            <Autocomplete
              size="small"
              open={openWriter}
              onOpen={() => setOpenWriter(true)}
              onClose={() => setOpenWriter(false)}
              options={['All Writers', ...writers.map((w) => w.name)]}
              value={writer === 'All' ? 'All Writers' : writer}
              onChange={(_, newValue) => {
                setWriter(newValue === 'All Writers' ? 'All' : newValue || 'All');
                setCurrentPage(1);
              }}
              filterOptions={(options, state) => {
                const inputValue = state.inputValue.trim().toLowerCase();
                if (!inputValue) return options;
                return options.filter((option) => {
                  if (option === 'All Writers') return false;
                  const lowerOption = option.toLowerCase();
                  if (inputValue.length === 1) {
                    return lowerOption.startsWith(inputValue);
                  } else {
                    const words = lowerOption.split(/\s+/);
                    return words.some(word => word.startsWith(inputValue));
                  }
                });
              }}
              slotProps={{
                paper: {
                  sx: {
                    maxHeight: 250,
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 250,
                    }
                  }
                }
              }}
              sx={{ width: { xs: '100%', sm: 200 } }}
              renderInput={(params) => <TextField {...params} placeholder="Filter by writer..." />}
            />
            <Autocomplete
              size="small"
              open={openYear}
              onOpen={() => setOpenYear(true)}
              onClose={() => setOpenYear(false)}
              options={['All Years', ...yearsList.filter(y => y !== 'All')]}
              value={year === 'All' ? 'All Years' : year}
              onChange={(_, newValue) => {
                setYear(newValue === 'All Years' ? 'All' : newValue || 'All');
                setCurrentPage(1);
              }}
              slotProps={{
                paper: {
                  sx: {
                    maxHeight: 250,
                    '& .MuiAutocomplete-listbox': {
                      maxHeight: 250,
                    }
                  }
                }
              }}
              sx={{ width: { xs: '100%', sm: 160 } }}
              renderInput={(params) => <TextField {...params} placeholder="Filter by year..." />}
            />
          </Stack>
          <Tabs
            value={channelsList.indexOf(channel)}
            onChange={(_, val) => { setChannel(channelsList[val]); setCurrentPage(1); }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 4, '& .MuiTab-root': { fontSize: '0.85rem', minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
          >
            {channelsList.map((ch) => (
              <Tab key={ch} label={ch === 'All' ? 'All Channels' : ch} />
            ))}
          </Tabs>

          {/* Content */}
          {loading ? (
            <AppLoadingState message="Loading catalog..." />
          ) : stories.length === 0 ? (
            <AppEmptyState title="No audio stories match your criteria" message="Try adjusting your search, filters, or add a new story!" actionLabel="Add Story" actionHref="/admin" />
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
                {stories.map((st) => (
                  <AppStoryCard key={st._id} {...st} isBookmarked={bookmarkIds.has(st._id)} isListened={listenIds.has(st._id)} onBookmarkToggle={toggleBookmark} />
                ))}
              </Box>
              <AppPagination page={currentPage} totalPages={pagination.totalPages} total={pagination.total} onChange={setCurrentPage} />
            </>
          )}
        </div>
      </Box>
    </div>
  );
}
