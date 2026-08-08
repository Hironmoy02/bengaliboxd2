'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Portal,
  IconButton,
  Chip,
  Fade,
  Stack,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CompassIcon from '@mui/icons-material/Explore';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';


import { usePathname } from 'next/navigation';

export interface TourStep {
  target: string; // data-tour attribute value or CSS selector
  title: string;
  description: string;
  position?: 'bottom' | 'top' | 'left' | 'right';
}

const DEFAULT_STEPS: TourStep[] = [
  {
    target: 'home-search',
    title: 'Search Audio Stories',
    description: 'Find thousands of Bengali audio dramas, thriller podcasts, audiobooks, and classic stories in seconds.',
    position: 'bottom',
  },
  {
    target: 'home-genres',
    title: 'Explore Genres & Themes',
    description: 'Easily filter stories by Sunday Suspense, Horror, Thriller, Romance, Detective, and Drama.',
    position: 'bottom',
  },
  {
    target: 'nav-explore',
    title: 'Full Story Catalog',
    description: 'Browse through top writers, top-rated audio tracks, length filters, and curated story collections.',
    position: 'bottom',
  },
  {
    target: 'nav-streak',
    title: 'Daily Streaks & Badges',
    description: 'Listen daily to keep your flame streak alive, earn Karma points, and unlock unique BengaliBoxd badges!',
    position: 'bottom',
  },
  {
    target: 'nav-profile',
    title: 'Profile & Custom Playlists',
    description: 'Manage your bookmarks, track listened stories, view unlocked badges, and restart this tour guide anytime.',
    position: 'bottom',
  },
];

const TOUR_STORAGE_KEY = 'bengaliboxd_tour_status';

export default function UserTourGuide() {
  const theme = useTheme();
  const pathname = usePathname();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Trigger tour welcome modal when a new user signs up (checks on route change)
  useEffect(() => {
    try {
      const justSignedUp = sessionStorage.getItem('bengaliboxd_just_signed_up');
      if (justSignedUp === 'true') {
        sessionStorage.removeItem('bengaliboxd_just_signed_up');
        const timer = setTimeout(() => setShowWelcomeModal(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access disabled or SSR
    }
  }, [pathname]);

  // Listen for manual or instant signup trigger events
  useEffect(() => {
    const handleNewSignup = () => {
      setShowWelcomeModal(true);
    };

    window.addEventListener('newSignupTourTrigger', handleNewSignup);
    return () => window.removeEventListener('newSignupTourTrigger', handleNewSignup);
  }, []);

  // Listen for manual trigger event (e.g. from Navbar menu)
  useEffect(() => {
    const handleManualStart = () => {
      setShowWelcomeModal(false);
      setCurrentStepIndex(0);
      setIsActive(true);
    };

    window.addEventListener('startUserTour', handleManualStart);
    return () => window.removeEventListener('startUserTour', handleManualStart);
  }, []);

  // Measure target element position
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;
    const currentStep = DEFAULT_STEPS[currentStepIndex];
    if (!currentStep) return;

    const element =
      document.querySelector(`[data-tour="${currentStep.target}"]`) ||
      document.querySelector(currentStep.target);

    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll into view gently if outside viewport
      const isInViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;

      if (!isInViewport) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStepIndex]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isActive && !showWelcomeModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (isActive) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, showWelcomeModal, currentStepIndex]);

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const handleSkip = () => {
    setShowWelcomeModal(false);
    setIsActive(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'skipped');
    } catch {}
  };

  const handleFinish = () => {
    setIsActive(false);
    setShowWelcomeModal(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'completed');
    } catch {}
  };

  const handleNext = () => {
    if (currentStepIndex < DEFAULT_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Render Welcome Modal
  if (showWelcomeModal) {
    return (
      <Portal>
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            px: 2,
          }}
        >
          <Fade in timeout={400}>
            <Paper
              elevation={24}
              sx={{
                maxWidth: 480,
                width: '100%',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'relative',
              }}
            >
              {/* Header Banner */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #ff5e2b 0%, #d4380d 100%)',
                  color: '#ffffff',
                  p: 3,
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={handleSkip}
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)' },
                  }}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                  }}
                >
                  <CompassIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                  Welcome to BengaliBoxd! 👋
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Your ultimate destination for Bengali audio stories & podcasts
                </Typography>
              </Box>

              {/* Body Content */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  Would you like a quick 1-minute guided tour to discover how to find stories, earn daily streak points, and unlock badges?
                </Typography>

                <Stack spacing={1.5}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleStartTour}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{
                      py: 1.2,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ff5e2b 0%, #e0481d 100%)',
                      boxShadow: '0 4px 14px rgba(255,94,43,0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e0481d 0%, #c43209 100%)',
                      },
                    }}
                  >
                    Take Interactive Tour
                  </Button>

                  <Button
                    variant="text"
                    size="medium"
                    fullWidth
                    onClick={handleSkip}
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      borderRadius: 3,
                      '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                    }}
                  >
                    Skip for Now
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Fade>
        </Box>
      </Portal>
    );
  }

  if (!isActive) return null;

  const currentStep = DEFAULT_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === DEFAULT_STEPS.length - 1;

  // Tooltip positioning math
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
    width: 320,
    maxWidth: 'calc(100vw - 32px)',
  };

  if (targetRect) {
    const pad = 16;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (currentStep.position === 'top' || (spaceBelow < 200 && spaceAbove > 200)) {
      // Place above target
      tooltipStyle.bottom = window.innerHeight - targetRect.top + pad;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 336));
    } else {
      // Default: Place below target
      tooltipStyle.top = targetRect.bottom + pad;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - 336));
    }
  } else {
    // Fallback centered position if target element is not found on page
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <Portal>
      {/* Dark backdrop with transparent cut-out highlight */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          pointerEvents: 'none',
        }}
      >
        {/* Full overlay mask */}
        <svg style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.65)"
            mask="url(#tour-mask)"
            style={{ pointerEvents: 'auto' }}
          />
        </svg>

        {/* Target highlight ring effect */}
        {targetRect && (
          <Box
            sx={{
              position: 'fixed',
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              borderRadius: '8px',
              border: '2px solid #ff5e2b',
              boxShadow: '0 0 0 4px rgba(255, 94, 43, 0.35), 0 0 20px rgba(255, 94, 43, 0.5)',
              pointerEvents: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'tourPulse 2s infinite',
              '@keyframes tourPulse': {
                '0%': { boxShadow: '0 0 0 2px rgba(255, 94, 43, 0.4)' },
                '50%': { boxShadow: '0 0 0 8px rgba(255, 94, 43, 0.15), 0 0 25px rgba(255, 94, 43, 0.6)' },
                '100%': { boxShadow: '0 0 0 2px rgba(255, 94, 43, 0.4)' },
              },
            }}
          />
        )}
      </Box>

      {/* Floating Tooltip Card */}
      <Paper
        elevation={16}
        style={tooltipStyle}
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header: Step counter & Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Chip
            label={`Step ${currentStepIndex + 1} of ${DEFAULT_STEPS.length}`}
            size="small"
            color="primary"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              bgcolor: 'primary.main',
              color: '#ffffff',
            }}
          />
          <IconButton onClick={handleSkip} size="small" title="Exit Tour (Esc)">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Content */}
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.8, color: 'text.primary' }}>
          {currentStep.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5, mb: 2.5 }}>
          {currentStep.description}
        </Typography>

        {/* Footer Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            size="small"
            onClick={handleSkip}
            sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}
          >
            Skip Tour
          </Button>

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              startIcon={<NavigateBeforeIcon />}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleNext}
              endIcon={isLastStep ? <CheckCircleOutlinedIcon fontSize="small" /> : <NavigateNextIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                background: isLastStep
                  ? 'linear-gradient(135deg, #2ea64e 0%, #1a7f37 100%)'
                  : 'linear-gradient(135deg, #ff5e2b 0%, #e0481d 100%)',
              }}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Portal>
  );
}
