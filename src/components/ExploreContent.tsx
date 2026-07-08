'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Chip,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StarIcon from '@mui/icons-material/Star';
import { formatDuration } from '@/lib/constants';
import type { CuratorConfig } from '@/lib/explore-picks';

interface Story {
  _id: string;
  title: string;
  channel: string;
  narrator?: string;
  genre?: string;
  writer?: string;
  youtubeId: string;
  thumbnailUrl?: string;
  averageRating: number;
  ratingsCount: number;
  duration?: number;
  yearPublished?: number;
}

interface CuratorWithStories extends CuratorConfig {
  stories: Story[];
}

interface ExploreContentProps {
  curators: CuratorWithStories[];
}

function StoryCard({ story, index }: { story: Story; index: number }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const thumbnail = story.thumbnailUrl || `https://img.youtube.com/vi/${story.youtubeId}/hqdefault.jpg`;
  const isPinned = index === 0;

  return (
    <Box
      component={Link}
      href={`/story/${story._id}`}
      sx={{
        textDecoration: 'none',
        display: 'block',
        flexShrink: 0,
        width: { xs: 160, sm: 185, md: 200 },
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        border: '1px solid',
        borderColor: isPinned
          ? isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.5)'
          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark
            ? '0 12px 32px rgba(0,0,0,0.5)'
            : '0 12px 32px rgba(0,0,0,0.15)',
          borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.20)',
        },
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
        <Box
          component="img"
          src={thumbnail}
          alt={story.title}
          sx={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Pinned badge */}
        {isPinned && (
          <Box
            sx={{
              position: 'absolute',
              top: 6, left: 6,
              bgcolor: 'rgba(245,158,11,0.92)',
              borderRadius: '6px',
              px: 0.75,
              py: 0.25,
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 10, color: '#fff' }} />
            <Typography sx={{ fontSize: '9px', fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Pick
            </Typography>
          </Box>
        )}
        {/* Duration badge */}
        {story.duration && story.duration > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 5, right: 5,
              bgcolor: 'rgba(0,0,0,0.72)',
              borderRadius: '5px',
              px: 0.6,
              py: 0.2,
            }}
          >
            <Typography sx={{ fontSize: '9px', color: '#fff', fontWeight: 500, letterSpacing: '0.03em' }}>
              {formatDuration(story.duration)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Card body */}
      <Box sx={{ p: 1.25 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1.35,
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {story.title}
        </Typography>
        {story.writer && (
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 0.5, lineHeight: 1.2 }}>
            {story.writer}
          </Typography>
        )}
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
          {story.averageRating > 0 ? (
            <>
              <StarIcon sx={{ fontSize: 11, color: '#f59e0b' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b' }}>
                {story.averageRating.toFixed(1)}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>No ratings</Typography>
          )}
          {story.yearPublished && (
            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', ml: 'auto !important' }}>
              {story.yearPublished}
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function CuratorSection({ curator, index }: { curator: CuratorWithStories; index: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' });
  };

  return (
    <Box
      sx={{
        mb: { xs: 6, md: 8 },
        borderRadius: 3,
        p: { xs: 2.5, md: 4 },
        background: isDark
          ? index === 0
            ? 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(239,68,68,0.04) 50%, rgba(0,0,0,0) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 50%, rgba(0,0,0,0) 100%)'
          : index === 0
            ? 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(239,68,68,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)',
        border: '1px solid',
        borderColor: isDark
          ? index === 0 ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.18)'
          : index === 0 ? 'rgba(245,158,11,0.22)' : 'rgba(99,102,241,0.22)',
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { xs: 'flex-start', sm: 'center' } }}
      >
        {/* Curator badge */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: curator.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 16px ${index === 0 ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)'}`,
          }}
        >
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {curator.initial}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.15rem' }, color: 'text.primary' }}>
              {curator.name}
            </Typography>
            <Chip
              label={curator.monthLabel}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                background: curator.gradient,
                color: '#fff',
                border: 'none',
              }}
            />
          </Stack>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.3, fontStyle: 'italic' }}>
            "{curator.tagline}"
          </Typography>
        </Box>

        {/* Scroll arrows — desktop only */}
        {!isMobile && (
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={() => scroll('left')}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                width: 30, height: 30,
                '&:hover': { color: 'text.primary', borderColor: 'text.secondary' },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => scroll('right')}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                width: 30, height: 30,
                '&:hover': { color: 'text.primary', borderColor: 'text.secondary' },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {/* Story scroll strip */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: { xs: 1.5, md: 2 },
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgba(255,255,255,0.15) transparent' : 'rgba(0,0,0,0.15) transparent',
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
          },
        }}
      >
        {curator.stories.map((story, i) => (
          <StoryCard key={story._id} story={story} index={i} />
        ))}
      </Box>

      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 1.5 }}>
        {curator.stories.length} {curator.stories.length === 1 ? 'story' : 'stories'} this month
      </Typography>
    </Box>
  );
}

export default function ExploreContent({ curators }: ExploreContentProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(180deg, rgba(20,10,5,0.8) 0%, transparent 300px)'
          : 'linear-gradient(180deg, rgba(254,243,199,0.3) 0%, transparent 300px)',
        pb: 10,
      }}
    >
      {/* Page header */}
      <Box
        sx={{
          pt: { xs: 5, md: 8 },
          pb: { xs: 4, md: 6 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: { xs: 4, md: 6 },
          textAlign: 'center',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, justifyContent: 'center', alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Curated Monthly Picks
          </Typography>
        </Stack>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2rem', md: '3rem' },
            letterSpacing: '-0.04em',
            background: isDark
              ? 'linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.6) 100%)'
              : 'linear-gradient(135deg, #1d1d1f 30%, rgba(29,29,31,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1,
          }}
        >
          Explore
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', maxWidth: 480, mx: 'auto' }}>
          Handpicked Bengali audio stories from our developers — refreshed every month.
        </Typography>
      </Box>

      {/* Curator sections */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
        {curators.map((curator, i) => (
          <CuratorSection key={curator.key} curator={curator} index={i} />
        ))}
      </Box>
    </Box>
  );
}
