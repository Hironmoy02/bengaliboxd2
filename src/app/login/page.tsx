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

  if (loading || user) return <AppLoadingState message="Loading session..." fullScreen />;

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

          {googleClientId ? (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>
              <div ref={googleBtnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
            </>
          ) : (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>
              <Box sx={{ p: 2, background: 'rgba(0,102,204,0.06)', borderRadius: 2, border: '1px solid rgba(0,102,204,0.15)' }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Google OAuth Sandbox Mode
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                  Configure <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> for real Google sign-in.
                </Typography>
              </Box>
            </>
          )}

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
