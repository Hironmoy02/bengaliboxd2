'use client';

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface AppSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  maxWidth?: number | string;
}

export default function AppSearchBar({ value, onChange, placeholder = 'Search...', fullWidth = true, maxWidth }: AppSearchBarProps) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      fullWidth={fullWidth}
      sx={{ maxWidth }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
