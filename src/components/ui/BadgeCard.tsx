'use client';

import React from 'react';
import { Paper, Box, Typography, Chip, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export interface BadgeCardProps {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
  category: 'listening' | 'community' | 'streak' | 'special';
  pointsBonus: number;
  isUnlocked: boolean;
  unlockedAt?: string | Date | null;
}

const TIER_COLORS = {
  bronze: { border: '#cd7f32', bg: 'rgba(205, 127, 50, 0.08)', text: '#cd7f32' },
  silver: { border: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.08)', text: '#e0e0e0' },
  gold: { border: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)', text: '#ffd700' },
  legendary: { border: '#00e5ff', bg: 'rgba(0, 229, 255, 0.12)', text: '#00e5ff' },
};

export default function BadgeCard({
  titleEn,
  titleBn,
  descriptionEn,
  descriptionBn,
  icon,
  tier,
  pointsBonus,
  isUnlocked,
  unlockedAt,
}: BadgeCardProps) {
  const tierStyle = TIER_COLORS[tier] || TIER_COLORS.bronze;

  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {titleBn} ({titleEn})
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
            {descriptionEn} / {descriptionBn}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: tierStyle.text, fontWeight: 700 }}>
            পুরস্কার: +{pointsBonus} রসগোল্লা
          </Typography>
          {isUnlocked && unlockedAt && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.disabled' }}>
              Unlocked on: {new Date(unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <Paper
        elevation={isUnlocked ? 2 : 0}
        sx={{
          p: 2,
          borderRadius: 3,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          border: '1.5px solid',
          borderColor: isUnlocked ? tierStyle.border : 'divider',
          bgcolor: isUnlocked ? tierStyle.bg : 'action.hover',
          opacity: isUnlocked ? 1 : 0.45,
          filter: isUnlocked ? 'none' : 'grayscale(80%)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: isUnlocked ? `0 8px 24px ${tierStyle.bg}` : 'none',
            opacity: isUnlocked ? 1 : 0.7,
            filter: 'none',
          },
        }}
      >
        {/* Tier Chip */}
        <Chip
          label={tier.toUpperCase()}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            height: 16,
            fontSize: '0.6rem',
            fontWeight: 800,
            bgcolor: isUnlocked ? tierStyle.border : 'action.disabledBackground',
            color: '#121212',
          }}
        />

        {/* Badge Icon */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            bgcolor: isUnlocked ? 'background.paper' : 'transparent',
            boxShadow: isUnlocked ? `0 0 12px ${tierStyle.border}44` : 'none',
            mb: 1.5,
            mt: 0.5,
          }}
        >
          {isUnlocked ? icon : <LockIcon sx={{ fontSize: 22, color: 'text.disabled' }} />}
        </Box>

        {/* Titles */}
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3, mb: 0.5 }}>
          {titleBn}
        </Typography>

        {/* Description */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: '0.72rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {descriptionBn}
        </Typography>
      </Paper>
    </Tooltip>
  );
}
