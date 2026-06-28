'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { googleLoginUser } from '@/store/authSlice';
import { Box, Typography, Button, Paper, Stack, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { AppTextField, AppAlert, AppLoadingState } from '@/components/ui';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dev Sandbox State
  const [mockEmail, setMockEmail] = useState('');
  const [mockName, setMockName] = useState('');

  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  // Google Callback Registrar
  useEffect(() => {
    if (!googleClientId) return;

    (window as any).handleGoogleCredentialResponse = async (response: any) => {
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
    };

    return () => {
      delete (window as any).handleGoogleCredentialResponse;
    };
  }, [googleClientId, dispatch, router]);

  const handleSandboxLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockEmail) {
      setError('Please provide a sandbox email');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(
        googleLoginUser({
          isMock: true,
          mockEmail,
          mockName: mockName || 'Hironmoy',
        })
      );
      if (googleLoginUser.rejected.match(result)) {
        setError((result.payload as string) || 'Sandbox registration failed');
      } else {
        router.push('/');
      }
    } catch {
      setError('Sandbox registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) return <AppLoadingState message="Loading session..." fullScreen />;

  return (
    <>
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: 440, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Create Account</Typography>
            <Typography color="text.secondary">Register or sign in instantly with Google SSO</Typography>
          </Box>

          {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}

          {googleClientId ? (
            <Stack spacing={3} sx={{ alignItems: 'center', py: 2 }}>
              {/* Google Native One Tap & Sign-in Button Containers */}
              <div
                id="g_id_onload"
                data-client_id={googleClientId}
                data-context="signup"
                data-ux_mode="popup"
                data-callback="handleGoogleCredentialResponse"
                data-auto_prompt="false"
              ></div>

              <div
                className="g_id_signin"
                data-type="standard"
                data-shape="pill"
                data-theme="outline"
                data-text="signup_with"
                data-size="large"
                data-logo_alignment="left"
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              ></div>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Box sx={{ p: 2, background: 'rgba(0,102,204,0.06)', borderRadius: 2, border: '1px solid rgba(0,102,204,0.15)' }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  💡 Google OAuth Sandbox Mode
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                  To enable real Google registration, configure <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in your <code>.env.local</code> file.
                </Typography>
              </Box>

              <form onSubmit={handleSandboxLogin}>
                <Stack spacing={2}>
                  <AppTextField
                    fullWidth
                    label="Email Address"
                    placeholder="e.g. hironmoychowdhury690@gmail.com"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    required
                  />
                  <AppTextField
                    fullWidth
                    label="Full Name"
                    placeholder="e.g. Hironmoy"
                    value={mockName}
                    onChange={(e) => setMockName(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<GoogleIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering...' : 'Register with Google (Sandbox)'}
                  </Button>
                </Stack>
              </form>
            </Stack>
          )}

          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.4 }}>
            Sign-in and registration are unified on Bengaliboxd. If you do not have an account, signing in with Google will instantly create one for you.
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
