'use client';

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AppLoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function AppLoadingState({ message = 'Loading...', fullScreen = false }: AppLoadingStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: fullScreen ? 0 : 8,
        minHeight: fullScreen ? '60vh' : undefined,
      }}
    >
      <CircularProgress size={36} sx={{ color: 'primary.main' }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
