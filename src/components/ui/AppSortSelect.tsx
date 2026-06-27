'use client';

import React from 'react';
import AppSelect from './AppSelect';
import { SORT_OPTIONS, type SortValue } from '@/lib/constants';

interface AppSortSelectProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  options?: { value: string; label: string }[];
  sx?: any;
}

const defaultOptions = [...SORT_OPTIONS];

export default function AppSortSelect({ value, onChange, options = defaultOptions, sx, ...props }: AppSortSelectProps & Record<string, any>) {
  return <AppSelect label="Sort by" options={options} value={value} onChange={(e) => onChange(e.target.value as SortValue)} sx={sx} {...props} />;
}
