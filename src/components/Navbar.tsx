'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logoutUser } from '@/store/authSlice';
import { useThemeMode } from '@/contexts/ThemeContext';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Chip,
  Tooltip,
  Fade,
} from '@mui/material';
import { getLevelTier, LEVEL_TIERS } from '@/lib/badges';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CompassIcon from '@mui/icons-material/Explore';
import api from '@/lib/axios';
import { StreakFlame } from '@/components/ui';

export default function Navbar() {
  const handleStartTour = () => {
    window.dispatchEvent(new CustomEvent('startUserTour'));
  };

  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [rankOpen, setRankOpen] = useState(false);
  const [rankPos, setRankPos] = useState<{ top: number; left: number } | null>(null);
  const rankChipRef = React.useRef<HTMLDivElement>(null);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [karmaPoints, setKarmaPoints] = useState<number>(0);

  const currentTier = getLevelTier(karmaPoints);

  const openRank = () => {
    if (rankChipRef.current) {
      const rect = rankChipRef.current.getBoundingClientRect();
      setRankPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
    setRankOpen(true);
  };

  const closeRank = () => setRankOpen(false);

  // Close rank panel after scrolling 60px
  React.useEffect(() => {
    if (!rankOpen) return;
    const scrollStart = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - scrollStart) > 60) closeRank();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [rankOpen]);

  // Close on click outside
  React.useEffect(() => {
    if (!rankOpen) return;
    const onDown = (e: MouseEvent) => {
      if (rankChipRef.current && !rankChipRef.current.closest('[data-rank-panel]')) {
        const panel = document.querySelector('[data-rank-panel]');
        if (panel && panel.contains(e.target as Node)) return;
        closeRank();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [rankOpen]);

  const fetchGamification = React.useCallback(() => {
    if (user) {
      api.get('/api/user/gamification')
        .then(({ data }) => {
          if (data.streak) setStreak(data.streak);
          if (typeof data.karmaPoints === 'number') setKarmaPoints(data.karmaPoints);
        })
        .catch(() => {});
    }
  }, [user]);

  React.useEffect(() => {
    fetchGamification();

    const handleCustomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.streak) setStreak(customEvent.detail.streak);
        if (typeof customEvent.detail.karmaPoints === 'number') setKarmaPoints(customEvent.detail.karmaPoints);
      } else {
        fetchGamification();
      }
    };

    window.addEventListener('gamificationUpdated', handleCustomUpdate);
    return () => {
      window.removeEventListener('gamificationUpdated', handleCustomUpdate);
    };
  }, [user, pathname, fetchGamification]);

  const handleLogout = () => {
    setProfileAnchor(null);
    dispatch(logoutUser());
  };

  const navLinks = [
    { href: '/', label: 'Stories' },
    { href: '/explore', label: 'Explore' },
    ...(user ? [{ href: '/add-story', label: 'Add Story' }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <AppBar
      position="sticky"
      sx={{
        height: 44,
        minHeight: '44px !important',
        '& .MuiToolbar-root': {
          minHeight: '44px !important',
          height: 44,
        },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, minHeight: '44px !important', height: 44 }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Dual dot — bengaliboxd logo mark */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 9, height: 9, borderRadius: '50%',
                bgcolor: 'primary.main',
                flexShrink: 0,
              }}
            />
            <Box
              sx={{
                width: 9, height: 9, borderRadius: '50%',
                bgcolor: 'error.main',
                flexShrink: 0,
                ml: '-4px',
              }}
            />
          </Box>
          <Typography
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '12px',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            Bengali<span style={{ color: 'var(--accent-on-dark)' }}>boxd</span>
          </Typography>
        </Link>

        {isMobile ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                onClick={toggleTheme}
                title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                  padding: '6px',
                }}
              >
                {mode === 'dark' ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
              </IconButton>
              <IconButton
                color="inherit"
                onClick={(e) => setMobileAnchor(e.currentTarget)}
                aria-label="Open menu"
                size="small"
                sx={{ padding: '6px', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              >
                <MenuIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Menu
              anchorEl={mobileAnchor}
              open={Boolean(mobileAnchor)}
              onClose={() => setMobileAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    mt: 1,
                    minWidth: 180,
                    borderRadius: '11px',
                  },
                },
              }}
            >
              {navLinks.map((link) => (
                <MenuItem
                  key={link.href}
                  component={Link}
                  href={link.href}
                  data-tour={link.href === '/explore' ? 'nav-explore' : link.href === '/add-story' ? 'nav-add-story' : undefined}
                  onClick={() => setMobileAnchor(null)}
                  selected={pathname === link.href}
                  sx={{
                    color: pathname === link.href ? 'primary.main' : 'text.primary',
                    fontWeight: pathname === link.href ? 600 : 400,
                    fontSize: '0.875rem',
                    letterSpacing: '-0.224px',
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  setMobileAnchor(null);
                  handleStartTour();
                }}
                sx={{ color: 'text.primary', fontSize: '0.875rem', letterSpacing: '-0.224px' }}
              >
                <CompassIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                Take Tour Guide
              </MenuItem>
              <Divider sx={{ borderColor: 'divider' }} />
              {user ? (
                <>
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={() => setMobileAnchor(null)}
                    selected={pathname === '/profile'}
                    sx={{
                      color: pathname === '/profile' ? 'primary.main' : 'text.primary',
                      display: 'flex',
                      gap: 1,
                      fontSize: '0.875rem',
                      letterSpacing: '-0.224px',
                    }}
                  >
                    <PersonIcon fontSize="small" />
                    {user.username}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMobileAnchor(null);
                      handleLogout();
                    }}
                    sx={{ color: 'text.primary', fontSize: '0.875rem', letterSpacing: '-0.224px' }}
                  >
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem
                    component={Link}
                    href="/login"
                    onClick={() => setMobileAnchor(null)}
                    sx={{ color: 'text.primary', fontSize: '0.875rem', letterSpacing: '-0.224px' }}
                  >
                    <LoginIcon fontSize="small" sx={{ mr: 1 }} />
                    Sign In
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/register"
                    onClick={() => setMobileAnchor(null)}
                    sx={{ color: 'text.primary', fontSize: '0.875rem', letterSpacing: '-0.224px' }}
                  >
                    <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
                    Sign Up
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Nav links — uppercase, quiet, apple style */}
            {navLinks.map((link) => (
              <Typography
                key={link.href}
                component={Link}
                href={link.href}
                data-tour={link.href === '/explore' ? 'nav-explore' : link.href === '/add-story' ? 'nav-add-story' : undefined}
                sx={{
                  color: pathname === link.href ? 'primary.main' : 'text.secondary',
                  fontWeight: 400,
                  fontSize: '12px',
                  letterSpacing: '-0.12px',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                  borderBottom: pathname === link.href ? '1px solid' : '1px solid transparent',
                  borderBottomColor: pathname === link.href ? 'primary.main' : 'transparent',
                  pb: '2px',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {link.label}
              </Typography>
            ))}

            {/* Tour Guide Button */}
            <IconButton
              onClick={handleStartTour}
              title="Take Tour Guide"
              size="small"
              sx={{
                color: 'text.secondary',
                padding: '6px',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <CompassIcon sx={{ fontSize: 16 }} />
            </IconButton>

            {/* Theme toggle */}
            <IconButton
              onClick={toggleTheme}
              title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              size="small"
              sx={{
                color: 'text.secondary',
                padding: '6px',
                '&:hover': { color: 'text.primary' },
              }}
            >
              {mode === 'dark' ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
            </IconButton>

            {user ? (
              <>
                <Box data-tour="nav-streak" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <StreakFlame currentStreak={streak.current} longestStreak={streak.longest} size="small" />
                </Box>

                {/* Rank Chip */}
                <Tooltip title="View all ranks" placement="bottom">
                  <Chip
                    ref={rankChipRef}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '15px', lineHeight: 1 }}>{currentTier.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: currentTier.color }}>
                          {currentTier.nameEn}
                        </span>
                      </Box>
                    }
                    onClick={openRank}
                    size="small"
                    sx={{
                      height: 26,
                      cursor: 'pointer',
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: currentTier.color + '55',
                      boxShadow: `0 0 8px ${currentTier.color}33`,
                      '& .MuiChip-label': { px: '8px' },
                      '&:hover': { bgcolor: 'action.selected', borderColor: currentTier.color },
                      transition: 'all 0.2s ease',
                    }}
                  />
                </Tooltip>

                {/* Rank Panel — custom fixed dropdown, no scroll lock */}
                <Fade in={rankOpen} timeout={180}>
                  <Box
                    data-rank-panel
                    sx={{
                      position: 'fixed',
                      top: rankPos?.top ?? 60,
                      left: rankPos ? Math.min(rankPos.left, window.innerWidth - 460) : 'auto',
                      transform: 'translateX(-50%)',
                      zIndex: 1400,
                      width: 440,
                      borderRadius: '12px',
                      bgcolor: '#0f0f12',
                      border: '1px solid rgba(255,255,255,0.09)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                      overflow: 'hidden',
                      pointerEvents: rankOpen ? 'auto' : 'none',
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <Typography sx={{ fontSize: '16px', fontWeight: 800, color: 'text.primary', letterSpacing: 0.5 }}>
                        ⚔️ House Rankings
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: 'text.disabled', mt: 0.4 }}>
                        Earn রসগোল্লা to climb the houses
                      </Typography>
                    </Box>

                    {/* House rows */}
                    <Box sx={{ py: 0.5 }}>
                      {LEVEL_TIERS.map((tier) => {
                        const isCurrentTier = tier.level === currentTier.level;
                        return (
                          <Box
                            key={tier.level}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              px: 3,
                              py: '10px',
                              transition: 'background 0.15s',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                            }}
                          >
                            {/* Icon */}
                            <Box sx={{ fontSize: '22px', lineHeight: 1, minWidth: 30, textAlign: 'center' }}>
                              {tier.icon}
                            </Box>

                            {/* Name + Motto */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: tier.color, lineHeight: 1 }}>
                                  {tier.nameEn}
                                </Typography>
                                {isCurrentTier && (
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '13px',
                                      lineHeight: 1,
                                      filter: `drop-shadow(0 0 5px ${tier.color})`,
                                      animation: 'rankCrownPulse 2s ease-in-out infinite',
                                      '@keyframes rankCrownPulse': {
                                        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                        '50%': { opacity: 0.7, transform: 'scale(1.2)' },
                                      },
                                    }}
                                  >
                                    👑
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: '11px', fontStyle: 'italic', color: 'text.disabled', lineHeight: 1.3, mt: '3px' }}>
                                &ldquo;{tier.motto}&rdquo;
                              </Typography>
                            </Box>

                            {/* Rosogolla range */}
                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: isCurrentTier ? tier.color : 'text.secondary' }}>
                                {tier.maxPoints === Infinity
                                  ? `${tier.minPoints.toLocaleString()}+`
                                  : `${tier.minPoints.toLocaleString()}\u2013${tier.maxPoints.toLocaleString()}`}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>রসগোল্লা</Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Footer */}
                    <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: 'text.disabled' }}>Your total</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 800, color: 'text.primary' }}>
                        {karmaPoints.toLocaleString()} রসগোল্লা
                      </Typography>
                    </Box>
                  </Box>
                </Fade>

                <Typography
                  component={Link}
                  href="/profile"
                  data-tour="nav-profile"
                  sx={{
                    color: pathname === '/profile' ? 'primary.main' : 'text.secondary',
                    fontWeight: 500,
                    fontSize: '12px',
                    letterSpacing: '-0.12px',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <PersonIcon sx={{ fontSize: 14 }} />
                  {user.username}
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.3,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'primary.main',
                      bgcolor: 'action.hover',
                      px: 0.8,
                      py: '1px',
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                    {karmaPoints}
                  </Box>
                </Typography>
                <IconButton
                  onClick={handleLogout}
                  title="Logout"
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    padding: '6px',
                    '&:hover': { color: 'error.main' },
                  }}
                >
                  <LogoutIcon sx={{ fontSize: 16 }} />
                </IconButton>

              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography
                  component={Link}
                  href="/login"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 400,
                    fontSize: '12px',
                    letterSpacing: '-0.12px',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  Sign In
                </Typography>
                <Typography
                  component={Link}
                  href="/register"
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#ffffff !important',
                    fontWeight: 400,
                    fontSize: '12px',
                    letterSpacing: '-0.12px',
                    textDecoration: 'none',
                    borderRadius: '9999px',
                    px: 1.5,
                    py: '4px',
                    transition: 'background-color 0.15s ease, transform 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:active': { transform: 'scale(0.95)' },
                  }}
                >
                  Sign Up
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
