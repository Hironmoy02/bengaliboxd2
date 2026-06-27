'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectProps } from '@mui/material';

interface AppSelectProps extends Omit<SelectProps, 'children'> {
  label: string;
  options: { value: string; label: string }[];
}

export default function AppSelect({ label, options, sx, ...props }: AppSelectProps) {
  const labelId = `select-${label.replace(/\s/g, '-').toLowerCase()}`;
  return (
    <FormControl size="small" sx={{ minWidth: 120, ...sx }}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        {...props}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
