'use client';

import React from 'react';
import { Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import Link from 'next/link';
import { YOUTUBE_THUMBNAIL } from '@/lib/constants';

interface StoryCardProps {
  _id: string;
  title: string;
  channel: string;
  narrator: string;
  genre: string;
  writer?: string;
  youtubeId: string;
  thumbnailUrl?: string;
  averageRating: number;
  ratingsCount: number;
  isBookmarked?: boolean;
  isListened?: boolean;
  onBookmarkToggle?: (storyId: string) => void;
}

export default function StoryCard({
  _id,
  title,
  channel,
  narrator,
  writer,
  youtubeId,
  thumbnailUrl,
  averageRating,
  ratingsCount,
  isBookmarked = false,
  isListened = false,
  onBookmarkToggle,
}: StoryCardProps) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        background: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          borderColor: 'rgba(255,94,43,0.3)',
          '& .bookmark-btn': { opacity: 1 },
        },
      }}
    >
      {onBookmarkToggle && (
        <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark for later'}>
          <IconButton
            className="bookmark-btn"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBookmarkToggle(_id);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: isBookmarked ? 'primary.main' : '#fff',
              opacity: isBookmarked ? 1 : 0,
              transition: 'opacity 0.2s ease',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
      <Link href={`/story/${_id}`} style={{ textDecoration: 'none' }}>
        <Box sx={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          <img
            src={thumbnailUrl || YOUTUBE_THUMBNAIL(youtubeId)}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {isListened && (
            <Box sx={{ position: 'absolute', bottom: 6, left: 6, bgcolor: 'rgba(16,185,129,0.9)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeadphonesIcon sx={{ fontSize: 14, color: '#fff' }} />
            </Box>
          )}
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {channel}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </Typography>
          {writer && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Written by {writer}
            </Typography>
          )}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {narrator}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <StarIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {averageRating > 0 ? averageRating.toFixed(1) : '-'}
              </Typography>
              <ChatBubbleOutlinedIcon sx={{ fontSize: 11, color: 'text.secondary', ml: 0.5 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {ratingsCount}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Link>
    </Box>
  );
}
