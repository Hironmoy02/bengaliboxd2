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
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import HeadphonesIcon from '@mui/icons-material/Headphones';
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
        backgroundColor: 'var(--navbar-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--navbar-border)',
        boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HeadphonesIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              '& span': { color: 'primary.main' },
            }}
          >
            Bengali<span>boxd</span>
          </Typography>
        </Link>

        {isMobile ? (
          <>
            <IconButton
              onClick={toggleTheme}
              title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton
              color="inherit"
              onClick={(e) => setMobileAnchor(e.currentTarget)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
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
                    sx={{ color: 'text.primary' }}
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
                    sx={{ color: 'text.primary' }}
                  >
                    <LoginIcon fontSize="small" sx={{ mr: 1 }} />
                    Sign In
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/register"
                    onClick={() => setMobileAnchor(null)}
                    sx={{ color: 'text.primary' }}
                  >
                    <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
                    Sign Up
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: pathname === link.href ? 'primary.main' : 'text.primary',
                  fontWeight: pathname === link.href ? 600 : 400,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: pathname === link.href ? '60%' : '0%',
                    height: '2px',
                    bgcolor: 'primary.main',
                    transition: 'width 0.2s ease',
                  },
                  '&:hover::after': { width: '60%' },
                }}
              >
                {link.label}
              </Button>
            ))}

            <IconButton
              onClick={toggleTheme}
              title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {user ? (
              <>
                <Button
                  component={Link}
                  href="/profile"
                  startIcon={<PersonIcon />}
                  sx={{
                    color: pathname === '/profile' ? 'primary.main' : 'text.primary',
                    textTransform: 'none',
                    fontWeight: pathname === '/profile' ? 600 : 400,
                    borderRadius: '20px',
                    px: 2,
                  }}
                >
                  {user.username}
                </Button>
                <IconButton
                  onClick={handleLogout}
                  title="Logout"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main' },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2,
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2,
                  }}
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
