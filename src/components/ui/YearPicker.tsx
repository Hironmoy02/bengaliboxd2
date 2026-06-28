'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Stack, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface YearPickerProps {
  value: string;
  onChange: (year: string) => void;
  showAllOption?: boolean;
  allLabel?: string;
  label?: string;
  minYear?: number;
  maxYear?: number;
  columns?: number;
  customYears?: number[];
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function YearPicker({
  value,
  onChange,
  showAllOption = false,
  allLabel = 'All Years',
  label,
  minYear = 1950,
  maxYear,
  columns = 4,
  customYears,
  size = 'small',
  fullWidth = false,
}: YearPickerProps) {
  const currentYear = new Date().getFullYear();
  const effectiveMax = maxYear ?? currentYear;
  const effectiveMin = minYear ?? 1950;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [decadeStart, setDecadeStart] = useState(() => {
    const selected = parseInt(value, 10);
    if (!isNaN(selected)) {
      return Math.floor(selected / 10) * 10;
    }
    return Math.floor(currentYear / 10) * 10;
  });

  const decadeEnd = decadeStart + 9;

  const years = useMemo(() => {
    if (customYears && customYears.length > 0) {
      return customYears.sort((a, b) => b - a);
    }
    const result: number[] = [];
    for (let y = decadeStart; y <= decadeEnd; y++) {
      result.push(y);
    }
    return result;
  }, [customYears, decadeStart, decadeEnd]);

  const canGoBack = !customYears && decadeStart > effectiveMin;
  const canGoForward = !customYears && decadeEnd < effectiveMax;

  const goBack = useCallback(() => {
    setDecadeStart((prev) => Math.max(prev - 10, effectiveMin));
  }, [effectiveMin]);

  const goForward = useCallback(() => {
    setDecadeStart((prev) => Math.min(prev + 10, effectiveMax));
  }, [effectiveMax]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleYearSelect = (year: string) => {
    onChange(year);
    setOpen(false);
  };

  const displayLabel = value === 'All' ? allLabel : value || 'Select Year';

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: 1,
            color: 'text.secondary',
            display: 'block',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
      )}
      <Button
        onClick={() => setOpen((prev) => !prev)}
        variant="outlined"
        size={size}
        fullWidth={fullWidth}
        startIcon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          fontWeight: 600,
          color: value ? 'text.primary' : 'text.secondary',
          borderColor: 'divider',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        {displayLabel}
      </Button>

      {open && (
        <PaperAnchor sx={{ zIndex: 1300 }}>
          <Box sx={{ p: 2, minWidth: 240 }}>
            {showAllOption && (
              <Box
                onClick={() => handleYearSelect('All')}
                sx={{
                  mb: 1.5,
                  py: 1,
                  px: 2,
                  textAlign: 'center',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid',
                  borderColor: value === 'All' ? 'primary.main' : 'divider',
                  bgcolor: value === 'All' ? 'primary.main' : 'transparent',
                  color: value === 'All' ? 'primary.contrastText' : 'text.secondary',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: value === 'All' ? 'primary.contrastText' : 'primary.main',
                  },
                }}
              >
                {allLabel}
              </Box>
            )}

            {!customYears && (
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <IconButton size="small" onClick={goBack} disabled={!canGoBack} sx={{ color: 'text.secondary' }}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {decadeStart}s
                </Typography>
                <IconButton size="small" onClick={goForward} disabled={!canGoForward} sx={{ color: 'text.secondary' }}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 0.5,
              }}
            >
              {years.map((year) => {
                const isSelected = value === String(year);
                const isDisabled = !customYears && (year < effectiveMin || year > effectiveMax);
                return (
                  <Box
                    key={year}
                    onClick={() => {
                      if (!isDisabled) handleYearSelect(String(year));
                    }}
                    sx={{
                      py: 1,
                      px: 0.5,
                      textAlign: 'center',
                      borderRadius: 1.5,
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: isDisabled ? 'default' : 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected
                        ? 'primary.contrastText'
                        : isDisabled
                          ? 'action.disabled'
                          : 'text.secondary',
                      transition: 'all 0.15s ease',
                      opacity: isDisabled ? 0.4 : 1,
                      '&:hover': isDisabled
                        ? {}
                        : {
                            borderColor: 'primary.main',
                            color: isSelected ? 'primary.contrastText' : 'primary.main',
                          },
                    }}
                  >
                    {year}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </PaperAnchor>
      )}
    </Box>
  );
}

function PaperAnchor({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        mt: 0.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
