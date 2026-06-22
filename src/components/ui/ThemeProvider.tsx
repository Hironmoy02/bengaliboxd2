'use client';

import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ff5e2b' },
    secondary: { main: '#a78bfa' },
    success: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    background: {
      default: '#0f0f1a',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    divider: 'rgba(255,255,255,0.08)',
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
            background: 'linear-gradient(135deg, #ff5e2b 0%, #ff8a5c 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #e04e1f 0%, #ff6b3d 100%)' },
          },
        },
        outlined: { borderColor: 'rgba(255,255,255,0.15)', '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' } },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.04)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
            '&.Mui-focused fieldset': { borderColor: '#ff5e2b' },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(255,255,255,0.04)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff5e2b' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: '#1a1a2e' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        filled: { '&.MuiChip-colorPrimary': { background: 'rgba(255,94,43,0.15)', color: '#ff5e2b', border: '1px solid rgba(255,94,43,0.3)' } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 44 },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: { '& .MuiPaginationItem-root': { color: '#94a3b8', borderColor: 'rgba(255,255,255,0.12)', '&.Mui-selected': { background: 'rgba(255,94,43,0.2)', color: '#ff5e2b', borderColor: '#ff5e2b' } },
        },
      },
    },
  },
});

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => createCache({ key: 'mui', prepend: true }));

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
