'use client';

import React from 'react';
import { AppThemeProvider } from '@/components/ui';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}
