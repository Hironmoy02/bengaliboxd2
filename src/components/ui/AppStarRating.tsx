'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';

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

  const handleClick = (star: number, isHalf: boolean) => {
    if (readonly || !onChange) return;
    onChange(isHalf ? star - 0.5 : star);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, star: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? star - 0.5 : star);
  };

  const renderStar = (star: number) => {
    if (star <= Math.floor(displayValue)) {
      return <StarIcon sx={{ fontSize: size, color: '#f59e0b', fill: '#f59e0b' }} />;
    }
    if (star - 0.5 <= displayValue) {
      return <StarHalfIcon sx={{ fontSize: size, color: '#f59e0b', fill: '#f59e0b' }} />;
    }
    return <StarBorderIcon sx={{ fontSize: size, color: 'text.secondary' }} />;
  };

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          onMouseMove={(e) => handleMouseMove(e, star)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            handleClick(star, x < rect.width / 2);
          }}
          sx={{ cursor: readonly ? 'default' : 'pointer', display: 'flex', lineHeight: 0 }}
        >
          {renderStar(star)}
        </Box>
      ))}
      {showLabel && value > 0 && (
        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, ml: 1 }}>
          {value} Star{value !== 1 ? 's' : ''}
        </Typography>
      )}
    </Stack>
  );
}
