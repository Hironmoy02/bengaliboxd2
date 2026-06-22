'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import Link from 'next/link';

interface AppEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function AppEmptyState({
  title = 'Nothing here yet',
  message = 'There are no items to display.',
  actionLabel,
  actionHref,
}: AppEmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.1)' }}>
      <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {message}
      </Typography>
      {actionLabel && actionHref && (
        <Button component={Link} href={actionHref} variant="contained" size="small">
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
