'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface AppPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function AppPageHeader({ title, subtitle, action }: AppPageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
