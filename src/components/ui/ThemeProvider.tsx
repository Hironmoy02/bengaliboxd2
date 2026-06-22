'use client';

import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useThemeMode } from '@/contexts/ThemeContext';

function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#ff5e2b' : '#e8512d' },
      secondary: { main: isDark ? '#a78bfa' : '#7c5cc4' },
      success: { main: isDark ? '#10b981' : '#059669' },
      error: { main: isDark ? '#ef4444' : '#dc2626' },
      warning: { main: isDark ? '#f59e0b' : '#d97706' },
      info: { main: isDark ? '#3b82f6' : '#2563eb' },
      background: {
        default: isDark ? '#0f0f1a' : '#fafbfe',
        paper: isDark ? '#1a1a2e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e2e8f0' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : '#e8ecf2',
    },
    typography: {
      fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: '0.9rem' },
          contained: {
            '&.MuiButton-containedPrimary': {
              background: isDark
                ? 'linear-gradient(135deg, #ff5e2b 0%, #ff8a5c 100%)'
                : 'linear-gradient(135deg, #e8512d 0%, #f07050 100%)',
              color: '#fff',
              '&:hover': {
                background: isDark
                  ? 'linear-gradient(135deg, #e04e1f 0%, #ff6b3d 100%)'
                  : 'linear-gradient(135deg, #d44420 0%, #e85e3e 100%)',
              },
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#d1d9e6',
            color: isDark ? 'rgba(255,255,255,0.8)' : '#334155',
            '&:hover': {
              borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#b0bdd0',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#dce3ed' },
              '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#b0bdd0' },
              '&.Mui-focused fieldset': { borderColor: isDark ? '#ff5e2b' : '#e8512d', borderWidth: 2 },
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#dce3ed' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#b0bdd0' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#ff5e2b' : '#e8512d', borderWidth: 2 },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e8ecf2'}`,
            boxShadow: isDark ? undefined : '0 20px 60px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
          filled: {
            '&.MuiChip-colorPrimary': {
              background: isDark ? 'rgba(255,94,43,0.15)' : 'rgba(232,81,45,0.08)',
              color: isDark ? '#ff5e2b' : '#d44420',
              border: `1px solid ${isDark ? 'rgba(255,94,43,0.3)' : 'rgba(232,81,45,0.2)'}`,
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#dce3ed',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, minHeight: 44 },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': {
              color: isDark ? '#94a3b8' : '#64748b',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#dce3ed',
              '&.Mui-selected': {
                background: isDark ? 'rgba(255,94,43,0.2)' : 'rgba(232,81,45,0.1)',
                color: isDark ? '#ff5e2b' : '#d44420',
                borderColor: isDark ? '#ff5e2b' : '#e8512d',
              },
              '&:hover': {
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => createCache({ key: 'mui', prepend: true }));
  const { mode } = useThemeMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
