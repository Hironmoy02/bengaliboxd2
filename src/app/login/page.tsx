'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { googleLoginUser, loginUser } from '@/store/authSlice';
import { Box, Typography, Button, Paper, Stack, Divider, CircularProgress } from '@mui/material';
import { AppTextField, AppAlert, AppLoadingState } from '@/components/ui';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  const handleGoogleResponse = useCallback(async (response: any) => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await dispatch(googleLoginUser({ idToken: response.credential }));
      if (googleLoginUser.rejected.match(result)) {
        setError((result.payload as string) || 'Google sign-in failed');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during Google sign-in');
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, router]);

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const renderGoogleBtn = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });
      google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
        width: googleBtnRef.current?.offsetWidth || 300,
      });
    };

    const google = (window as any).google;
    if (google?.accounts?.id) {
      renderGoogleBtn();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleBtn();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId, handleGoogleResponse]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please enter your email/username and password');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(loginUser({ emailOrUsername: emailOrUsername.trim(), password }));
      if (loginUser.rejected.match(result)) {
        setError((result.payload as string) || 'Login failed');
      } else {
        router.push('/');
      }
    } catch {
      setError('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await dispatch(googleLoginUser({ isMock: true }));
      if (googleLoginUser.rejected.match(result)) {
        setError((result.payload as string) || 'Google sign-in failed');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during Google sign-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {googleClientId && (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: 440, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Sign In</Typography>
            <Typography color="text.secondary">Sign in with email & password or Google</Typography>
          </Box>

          {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleEmailLogin}>
            <Stack spacing={2}>
              <AppTextField
                fullWidth
                label="Email or Username"
                placeholder="e.g. you@example.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
              <AppTextField
                fullWidth
                label="Password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Typography
              variant="caption"
              color="primary.main"
              sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/forgot-password')}
            >
              Forgot password?
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">OR</Typography>
          </Divider>

          {googleClientId && (
            <div ref={googleBtnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
          )}

          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={handleQuickGoogleLogin}
            disabled={isSubmitting}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"/>
                <path fill="#FBBC05" d="M3.87 10.78c-.18-.53-.28-1.09-.28-1.78s.1-1.25.28-1.78L.97 4.96C.35 6.18 0 7.55 0 9s.35 2.82.97 4.04l2.9-2.26z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.96l2.9 2.26C4.59 5.05 6.62 3.58 9 3.58z"/>
              </svg>
            }
            sx={{
              borderRadius: '9999px',
              borderColor: 'divider',
              color: 'text.primary',
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover',
              },
            }}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Continue with Google'}
          </Button>

          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.4 }}>
            Don&apos;t have an account?{' '}
            <Typography
              component="span"
              variant="caption"
              color="primary.main"
              sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/register')}
            >
              Create account
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
