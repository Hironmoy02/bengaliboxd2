'use client';

import React from 'react';
import { Stack, IconButton, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface AppStarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
  showLabel?: boolean;
}

export default function AppStarRating({ value, onChange, size = 28, readonly = false, showLabel = false }: AppStarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState(0);
  const displayValue = hoverValue || value;

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IconButton
          key={star}
          size="small"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          sx={{ p: 0.25 }}
        >
          {star <= displayValue ? (
            <StarIcon sx={{ fontSize: size, color: '#f59e0b', fill: '#f59e0b' }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: size, color: 'text.secondary' }} />
          )}
        </IconButton>
      ))}
      {showLabel && value > 0 && (
        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, ml: 1 }}>
          {value} Star{value > 1 ? 's' : ''}
        </Typography>
      )}
    </Stack>
  );
}
