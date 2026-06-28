'use client';

import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useThemeMode } from '@/contexts/ThemeContext';

function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      // Action Blue — single interactive accent, mirroring bengaliboxd design system
      primary: { main: isDark ? '#2997ff' : '#0066cc' },
      secondary: { main: isDark ? '#cccccc' : '#333333' },
      success: { main: isDark ? '#30d158' : '#248a3d' },
      error: { main: isDark ? '#ff453a' : '#d70015' },
      warning: { main: isDark ? '#f5a623' : '#c77700' },
      info: { main: isDark ? '#2997ff' : '#0066cc' },
      background: {
        default: isDark ? '#000000' : '#f5f5f7',
        paper: isDark ? '#272729' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#1d1d1f',
        secondary: isDark ? '#cccccc' : '#333333',
        disabled: isDark ? '#7a7a7a' : '#7a7a7a',
      },
      divider: isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      h1: { fontWeight: 600, letterSpacing: '-0.28px' },
      h2: { fontWeight: 600, letterSpacing: '-0.28px' },
      h3: { fontWeight: 600, letterSpacing: '-0.28px' },
      h4: { fontWeight: 600, letterSpacing: '-0.224px' },
      h5: { fontWeight: 600, letterSpacing: '-0.224px' },
      h6: { fontWeight: 600, letterSpacing: '-0.224px' },
      body1: { fontSize: '1rem', letterSpacing: '-0.374px', lineHeight: 1.47 },
      body2: { fontSize: '0.875rem', letterSpacing: '-0.224px', lineHeight: 1.43 },
      caption: { fontSize: '0.75rem', letterSpacing: '-0.12px' },
      button: { textTransform: 'none', fontWeight: 400, letterSpacing: '-0.224px' },
    },
    shape: { borderRadius: 11 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 9999,
            padding: '9px 20px',
            fontWeight: 400,
            fontSize: '0.875rem',
            letterSpacing: '-0.224px',
            transition: 'background-color 0.15s ease, transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:active': { transform: 'scale(0.95)' },
          },
          contained: {
            '&.MuiButton-containedPrimary': {
              background: isDark ? '#2997ff' : '#0066cc',
              color: '#ffffff',
              '&:hover': {
                background: isDark ? '#4aa5ff' : '#0071e3',
              },
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(41, 151, 255, 0.50)' : '#0066cc',
            color: isDark ? '#2997ff' : '#0066cc',
            '&:hover': {
              borderColor: isDark ? '#2997ff' : '#0071e3',
              background: isDark ? 'rgba(0,102,204,0.06)' : 'rgba(0,102,204,0.04)',
            },
          },
          text: {
            color: isDark ? '#2997ff' : '#0066cc',
            '&:hover': {
              background: isDark ? 'rgba(0,102,204,0.06)' : 'rgba(0,102,204,0.04)',
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
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0' },
              '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.20)' : '#b0bdd0' },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? '#2997ff' : '#0066cc',
                borderWidth: 2,
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: isDark ? '#2997ff' : '#0066cc',
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
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : '#b0bdd0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#2997ff' : '#0066cc',
              borderWidth: 2,
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            borderRadius: 11,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0'}`,
            background: isDark ? '#2a2a2c' : '#ffffff',
            boxShadow: isDark
              ? 'rgba(0,0,0,0.5) 0px 16px 40px 0px'
              : 'rgba(0,0,0,0.10) 0px 12px 32px 0px',
          },
          option: {
            fontSize: '0.875rem',
            letterSpacing: '-0.224px',
            '&[aria-selected="true"]': {
              backgroundColor: isDark ? 'rgba(41, 151, 255, 0.15)' : 'rgba(0,102,204,0.08)',
              color: isDark ? '#2997ff' : '#0066cc',
            },
            '&.Mui-focused': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#272729' : '#ffffff',
            boxShadow: isDark
              ? 'none'
              : 'rgba(0,0,0,0.06) 0px 1px 4px, rgba(0,0,0,0.04) 0px 1px 2px',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
            backgroundColor: isDark ? '#272729' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0'}`,
            boxShadow: isDark
              ? 'rgba(0,0,0,0.5) 0px 24px 60px 0px'
              : 'rgba(0,0,0,0.12) 0px 20px 60px 0px',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 9999, fontWeight: 400, fontSize: '0.75rem', letterSpacing: '0.04em' },
          filled: {
            '&.MuiChip-colorPrimary': {
              background: isDark ? 'rgba(0,102,204,0.15)' : 'rgba(0,102,204,0.07)',
              color: isDark ? '#2997ff' : '#0066cc',
              border: `1px solid ${isDark ? 'rgba(0,102,204,0.30)' : 'rgba(0,102,204,0.20)'}`,
            },
          },
          outlined: {
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e0e0e0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 400,
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransformLetterSpacing: 'uppercase',
            minHeight: 44,
            '&.Mui-selected': {
              fontWeight: 600,
              color: isDark ? '#2997ff' : '#0066cc',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: isDark ? '#2997ff' : '#0066cc',
            height: 2,
          },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': {
              color: isDark ? '#cccccc' : '#333333',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0',
              borderRadius: 9999,
              '&.Mui-selected': {
                background: isDark ? 'rgba(0,102,204,0.20)' : 'rgba(0,102,204,0.10)',
                color: isDark ? '#2997ff' : '#0066cc',
                borderColor: isDark ? '#2997ff' : '#0066cc',
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
            backgroundColor: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(245,245,247,0.88)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: 'none',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 11,
            border: `1px solid`,
            // Color overrides per severity variant via CSS selectors
            '&.MuiAlert-standardSuccess': {
              borderColor: isDark ? 'rgba(48,209,88,0.30)' : 'rgba(36,138,61,0.30)',
              backgroundColor: isDark ? 'rgba(48,209,88,0.08)' : 'rgba(36,138,61,0.06)',
              color: isDark ? '#30d158' : '#248a3d',
            },
            '&.MuiAlert-standardError': {
              borderColor: isDark ? 'rgba(255,69,58,0.30)' : 'rgba(215,0,21,0.25)',
              backgroundColor: isDark ? 'rgba(255,69,58,0.08)' : 'rgba(215,0,21,0.06)',
              color: isDark ? '#ff453a' : '#d70015',
            },
            '&.MuiAlert-standardWarning': {
              borderColor: isDark ? 'rgba(245,166,35,0.30)' : 'rgba(199,119,0,0.30)',
              backgroundColor: isDark ? 'rgba(245,166,35,0.08)' : 'rgba(199,119,0,0.06)',
            },
            '&.MuiAlert-standardInfo': {
              borderColor: isDark ? 'rgba(41,151,255,0.30)' : 'rgba(0,102,204,0.25)',
              backgroundColor: isDark ? 'rgba(41,151,255,0.08)' : 'rgba(0,102,204,0.06)',
              color: isDark ? '#2997ff' : '#0066cc',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#2a2a2c' : '#1d1d1f',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)'}`,
            borderRadius: 8,
            fontSize: '0.75rem',
            letterSpacing: '-0.12px',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s ease',
            '&:active': { transform: 'scale(0.92)' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#e0e0e0',
            fontSize: '0.875rem',
            letterSpacing: '-0.224px',
          },
          head: {
            fontWeight: 600,
            color: isDark ? '#cccccc' : '#333333',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            height: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : '#e0e0e0',
          },
          bar: {
            borderRadius: 9999,
            backgroundColor: isDark ? '#2997ff' : '#0066cc',
          },
        },
      },
    },
  });
}

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  // Build the Emotion cache once, tracking whether styles have been inserted
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'mui' });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  // Inject styles collected during SSR into <head> before hydration
  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

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
