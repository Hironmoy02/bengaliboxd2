'use client';

import React from 'react';
import { Snackbar, Alert, Box, Typography, Button } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { BadgeDefinition } from '@/lib/badges';

interface BadgeUnlockToastProps {
  open: boolean;
  onClose: () => void;
  badge?: BadgeDefinition | null;
}

export default function BadgeUnlockToast({ open, onClose, badge }: BadgeUnlockToastProps) {
  if (!badge) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        icon={<AutoAwesomeIcon sx={{ color: '#ffd700', fontSize: 28 }} />}
        sx={{
          bgcolor: '#18181b',
          color: '#ffffff',
          border: '1.5px solid #ffd700',
          borderRadius: 3,
          boxShadow: '0 12px 32px rgba(255, 215, 0, 0.25)',
          minWidth: 300,
          '& .MuiAlert-icon': { alignItems: 'center' },
        }}
      >
        <Box sx={{ pr: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: '#ffd700', fontWeight: 800 }}>
            🎉 নতুন ব্যাজ আনলক হয়েছে!
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {badge.icon} {badge.titleBn}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 0.5 }}>
            {badge.descriptionBn} (+{badge.pointsBonus} রসগোল্লা)
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
