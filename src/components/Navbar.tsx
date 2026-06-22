'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logoutUser } from '@/store/authSlice';
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

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
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
        backgroundColor: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HeadphonesIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
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
                    bgcolor: 'rgba(25, 25, 25, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    color: pathname === link.href ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
                    fontWeight: pathname === link.href ? 600 : 400,
                  }}
                >
                  {link.label}
                </MenuItem>
              ))}
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              {user ? (
                <>
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={() => setMobileAnchor(null)}
                    selected={pathname === '/profile'}
                    sx={{
                      color: pathname === '/profile' ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
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
                    sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
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
                    sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  >
                    <LoginIcon fontSize="small" sx={{ mr: 1 }} />
                    Sign In
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/register"
                    onClick={() => setMobileAnchor(null)}
                    sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
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
                  color: pathname === link.href ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
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

            {user ? (
              <>
                <Button
                  component={Link}
                  href="/profile"
                  startIcon={<PersonIcon />}
                  sx={{
                    color: pathname === '/profile' ? 'primary.main' : 'rgba(255, 255, 255, 0.8)',
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
                    color: 'rgba(255, 255, 255, 0.6)',
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
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2,
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      bgcolor: 'rgba(255, 94, 43, 0.05)',
                    },
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
                    bgcolor: 'primary.main',
                    color: '#fff',
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2,
                    '&:hover': { bgcolor: 'primary.dark' },
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
