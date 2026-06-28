'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { loginUser } from '@/store/authSlice';
import { Box, Typography, Button, Paper } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { AppTextField, AppAlert, AppLoadingState } from '@/components/ui';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) { setError('Please fill in all fields'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(loginUser({ emailOrUsername, password }));
      if (loginUser.rejected.match(result)) {
        setError((result.payload as string) || 'Login failed');
      } else {
        router.push('/');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) return <AppLoadingState message="Loading session..." fullScreen />;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Welcome Back</Typography>
          <Typography color="text.secondary">Log in to rate and review your favorite audio stories</Typography>
        </Box>

        {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <AppTextField
            fullWidth
            label="Username or Email"
            placeholder="e.g. somak_fan or user@example.com"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
            sx={{ mb: 2.5 }}
          />
          <AppTextField
            fullWidth
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" sx={{ textAlign: 'right', mb: 3 }}>
            <Link href="/forgot-password" style={{ color: 'var(--accent-on-dark)', fontWeight: 500, textDecoration: 'none', fontSize: '0.85rem' }}>
              Forgot Password?
            </Link>
          </Typography>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            startIcon={<LoginIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-on-dark)', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
