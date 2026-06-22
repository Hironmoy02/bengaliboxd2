'use client';

import React from 'react';
import { ThemeModeProvider } from '@/contexts/ThemeContext';
import { AppThemeProvider } from '@/components/ui';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <AppThemeProvider>{children}</AppThemeProvider>
    </ThemeModeProvider>
  );
}
