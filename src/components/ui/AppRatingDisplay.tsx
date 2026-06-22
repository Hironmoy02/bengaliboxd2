'use client';

import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

interface AppRatingDisplayProps {
  rating: number;
  count: number;
  size?: number;
  showCount?: boolean;
}

export default function AppRatingDisplay({ rating, count, size = 14, showCount = true }: AppRatingDisplayProps) {
  const floor = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Stack direction="row" spacing={0.25}>
        {[1, 2, 3, 4, 5].map((i) => {
          if (i <= floor) return <StarIcon key={i} sx={{ fontSize: size, color: '#f59e0b', fill: '#f59e0b' }} />;
          if (i === floor + 1 && hasHalf) {
            return (
              <Box key={i} sx={{ position: 'relative', display: 'inline-flex' }}>
                <StarIcon sx={{ fontSize: size, color: 'text.secondary' }} />
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
                  <StarIcon sx={{ fontSize: size, color: '#f59e0b', fill: '#f59e0b' }} />
                </Box>
              </Box>
            );
          }
          return <StarIcon key={i} sx={{ fontSize: size, color: 'text.secondary' }} />;
        })}
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 600, ml: 0.5 }}>
        {rating > 0 ? rating.toFixed(1) : '-'}
      </Typography>
      {showCount && (
        <Typography variant="caption" color="text.secondary">
          ({count})
        </Typography>
      )}
    </Stack>
  );
}
