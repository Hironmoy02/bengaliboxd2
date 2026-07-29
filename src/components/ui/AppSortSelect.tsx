'use client';

import React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import { SORT_OPTIONS, type SortValue } from '@/lib/constants';

interface AppSortSelectProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  options?: { value: string; label: string }[];
  sx?: any;
}

const defaultOptions = [...SORT_OPTIONS];

export default function AppSortSelect({ value, onChange, options = defaultOptions, sx }: AppSortSelectProps) {
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_, newValue) => {
        if (newValue) onChange(newValue.value as SortValue);
      }}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, optValue) => option.value === optValue.value}
      disableClearable
      size="small"
      sx={{ minWidth: 150, ...sx }}
      renderInput={(params) => <TextField {...params} placeholder="Sort by" />}
    />
  );
}
