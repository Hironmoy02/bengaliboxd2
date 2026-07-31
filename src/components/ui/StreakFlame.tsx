'use client';

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

interface StreakFlameProps {
  currentStreak: number;
  longestStreak?: number;
  size?: 'small' | 'medium';
}

export default function StreakFlame({ currentStreak, longestStreak = 0, size = 'small' }: StreakFlameProps) {
  const isActive = currentStreak > 0;
  const isSmall = size === 'small';

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            🔥 {currentStreak} Day Listening Streak
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
            {isActive
              ? 'Great job! Listen or review daily to keep your flame burning.'
              : 'Listen to an audio story today to start a new streak!'}
          </Typography>
          {longestStreak > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 600, color: 'primary.main' }}>
              Personal Best: {longestStreak} days
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: isSmall ? 1 : 1.5,
          py: isSmall ? '2px' : '4px',
          borderRadius: '9999px',
          bgcolor: isActive ? 'rgba(255, 107, 0, 0.12)' : 'action.hover',
          border: '1px solid',
          borderColor: isActive ? 'rgba(255, 107, 0, 0.4)' : 'divider',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: isActive ? '0 0 12px rgba(255, 107, 0, 0.3)' : 'none',
          },
        }}
      >
        <LocalFireDepartmentIcon
          sx={{
            fontSize: isSmall ? 16 : 20,
            color: isActive ? '#ff6b00' : 'text.disabled',
            filter: isActive ? 'drop-shadow(0 0 4px rgba(255, 107, 0, 0.6))' : 'none',
            animation: isActive ? 'pulseFlame 2s infinite ease-in-out' : 'none',
            '@keyframes pulseFlame': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.15)' },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            fontSize: isSmall ? '0.72rem' : '0.825rem',
            color: isActive ? '#ff8c38' : 'text.secondary',
            lineHeight: 1,
          }}
        >
          {currentStreak}d
        </Typography>
      </Box>
    </Tooltip>
  );
}
