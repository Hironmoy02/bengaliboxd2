'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectProps } from '@mui/material';

interface AppSelectProps extends Omit<SelectProps, 'children'> {
  label: string;
  options: { value: string; label: string }[];
}

export default function AppSelect({ label, options, sx, ...props }: AppSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 150, ...sx }}>
      <Select
        displayEmpty
        renderValue={(selected) => {
          const foundOption = options.find((opt) => opt.value === selected);
          return foundOption ? foundOption.label : String(selected);
        }}
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
