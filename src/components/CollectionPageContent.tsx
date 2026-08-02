'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CollectionsIcon from '@mui/icons-material/Collections';
import { formatDuration } from '@/lib/constants';

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

interface CollectionPageContentProps {
  collection: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    gradient: string;
  };
  stories: Story[];
}

export default function CollectionPageContent({ collection, stories }: CollectionPageContentProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ minHeight: '80vh', pb: 8 }}>
      {/* Hero header */}
      <Box
        sx={{
          background: collection.gradient,
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Stack
            component={Link}
            href="/explore"
            direction="row"
            spacing={0.5}
            sx={{ textDecoration: 'none', color: '#fff', mb: 3, alignItems: 'center', opacity: 0.85, '&:hover': { opacity: 1 } }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Back to Explore</Typography>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1 }}>
            <CollectionsIcon sx={{ fontSize: 28, color: '#fff' }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
              {collection.name}
            </Typography>
          </Stack>

          {collection.description && (
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', maxWidth: 600, mt: 1 }}>
              {collection.description}
            </Typography>
          )}

          <Chip
            label={`${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
            size="small"
            sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
          />
        </Box>
      </Box>

      {/* Stories grid */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, mt: 4 }}>
        {stories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No stories in this collection yet.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Stories will appear here once added by an admin.
            </Typography>
          </Box>
        ) : (
          <Stack
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: { xs: 1.5, md: 2 },
            }}
          >
            {stories.map((story) => {
              const thumbnail = story.thumbnailUrl || `https://img.youtube.com/vi/${story.youtubeId}/hqdefault.jpg`;

              return (
                <Box
                  key={story._id}
                  component={Link}
                  href={`/story/${story._id}`}
                  sx={{
                    textDecoration: 'none',
                    display: 'block',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
                    <Box
                      component="img"
                      src={thumbnail}
                      alt={story.title}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {story.duration && story.duration > 0 && (
                      <Box
                        sx={{
                          position: 'absolute', bottom: 5, right: 5,
                          bgcolor: 'rgba(0,0,0,0.72)', borderRadius: '5px', px: 0.6, py: 0.2,
                        }}
                      >
                        <Typography sx={{ fontSize: '9px', color: '#fff', fontWeight: 500 }}>
                          {formatDuration(story.duration)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ p: 1.25 }}>
                    <Typography
                      sx={{
                        fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.35, mb: 0.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
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
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b' }}>
                          ★ {story.averageRating.toFixed(1)}
                        </Typography>
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
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
