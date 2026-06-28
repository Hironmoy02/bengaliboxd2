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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setProfileAnchor(null);
    dispatch(logoutUser());
  };

  const navLinks = [
    { href: '/', label: 'Stories' },
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
                <Typography
                  component={Link}
                  href="/profile"
                  sx={{
                    color: pathname === '/profile' ? 'primary.main' : 'text.secondary',
                    fontWeight: 400,
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
