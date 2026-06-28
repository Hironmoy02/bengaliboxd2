'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { googleLoginUser, registerUser } from '@/store/authSlice';
import { Box, Typography, Button, Paper, Stack, Divider, CircularProgress, TextField } from '@mui/material';
import { AppTextField, AppAlert, AppLoadingState } from '@/components/ui';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

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
        text: 'signup_with',
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

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose: 'registration' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }
      setOtpSent(true);
      setOtpCooldown(60);
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), purpose: 'registration' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP verification failed');
        return;
      }
      setVerificationToken(data.verificationToken);
      setEmailVerified(true);
      setStep('form');
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (otpCooldown > 0) return;
    setOtp('');
    await handleSendOTP();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified || !verificationToken) {
      setError('Please verify your email first');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(
        registerUser({ username: username.trim(), email: email.trim(), password, verificationToken })
      );
      if (registerUser.rejected.match(result)) {
        setError((result.payload as string) || 'Registration failed');
      } else {
        router.push('/');
      }
    } catch {
      setError('Registration failed');
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
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Create Account</Typography>
            <Typography color="text.secondary">
              {step === 'otp' ? 'Enter the OTP sent to your email' : emailVerified ? 'Complete your registration' : 'Sign up with email or Google'}
            </Typography>
          </Box>

          {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}

          {step === 'otp' ? (
            <Stack spacing={3}>
              <Box sx={{ p: 2, background: 'rgba(255,94,43,0.06)', borderRadius: 2, border: '1px solid rgba(255,94,43,0.15)' }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  OTP sent to {email}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                  Check your inbox and enter the 6-digit code below.
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="6-Digit OTP"
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                slotProps={{ input: { style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8, fontWeight: 700 }, inputProps: { maxLength: 6 } } }}
                autoFocus
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleVerifyOTP}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Verify OTP'}
              </Button>

              <Button
                variant="text"
                fullWidth
                onClick={handleResendOTP}
                disabled={otpCooldown > 0}
                sx={{ textTransform: 'none' }}
              >
                {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
              </Button>

              <Button
                variant="text"
                fullWidth
                onClick={() => { setStep('form'); setOtp(''); }}
                sx={{ textTransform: 'none' }}
              >
                Back to form
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3}>
              {!emailVerified && (
                <Stack spacing={2}>
                  <AppTextField
                    fullWidth
                    label="Email Address"
                    placeholder="e.g. you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={emailVerified}
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={handleSendOTP}
                    disabled={isSubmitting || emailVerified || !email.trim()}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : emailVerified ? 'Email Verified' : 'Send Verification OTP'}
                  </Button>
                </Stack>
              )}

              {emailVerified && (
                <Box sx={{ p: 1.5, background: 'rgba(46,160,67,0.08)', borderRadius: 2, border: '1px solid rgba(46,160,67,0.2)', textAlign: 'center' }}>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                    Email verified: {email}
                  </Typography>
                </Box>
              )}

              {googleClientId ? (
                <>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="text.secondary">OR</Typography>
                  </Divider>
                  <div ref={googleBtnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
                </>
              ) : (
                <>
                  <Divider sx={{ my: 1 }}>
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
            </Stack>
          )}

          {step === 'form' && emailVerified && (
            <form onSubmit={handleRegister}>
              <Stack spacing={2} sx={{ mt: 3 }}>
                <AppTextField
                  fullWidth
                  label="Username"
                  placeholder="e.g. storyteller42"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <AppTextField
                  fullWidth
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
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
                  {isSubmitting ? <CircularProgress size={24} /> : 'Create Account'}
                </Button>
              </Stack>
            </form>
          )}

          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', lineHeight: 1.4 }}>
            Already have an account?{' '}
            <Typography
              component="span"
              variant="caption"
              color="primary.main"
              sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
              onClick={() => router.push('/login')}
            >
              Sign in
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
