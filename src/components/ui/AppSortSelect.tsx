'use client';

import React from 'react';
import AppSelect from './AppSelect';
import { SORT_OPTIONS, type SortValue } from '@/lib/constants';

interface AppSortSelectProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  options?: { value: string; label: string }[];
}

const defaultOptions = [...SORT_OPTIONS];

export default function AppSortSelect({ value, onChange, options = defaultOptions }: AppSortSelectProps) {
  return <AppSelect label="Sort by" options={options} value={value} onChange={(e) => onChange(e.target.value as SortValue)} />;
}
