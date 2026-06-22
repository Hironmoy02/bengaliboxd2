'use client';

import React from 'react';
import { Stack, Chip } from '@mui/material';

interface AppFilterChipsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
  color?: 'primary' | 'default';
}

export default function AppFilterChips({ options, selected, onChange, size = 'small' }: AppFilterChipsProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          size={size}
          variant={selected === opt ? 'filled' : 'outlined'}
          color={selected === opt ? 'primary' : 'default'}
          onClick={() => onChange(opt)}
          sx={{
            borderColor: selected === opt ? undefined : 'rgba(255,255,255,0.15)',
            '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
          }}
        />
      ))}
    </Stack>
  );
}
