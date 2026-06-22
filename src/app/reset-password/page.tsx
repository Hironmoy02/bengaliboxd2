'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { Box, Typography, Button, Paper } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import { AppTextField, AppAlert, AppLoadingState } from '@/components/ui';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Invalid Link</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            This password reset link is invalid or missing a token. Please request a new one.
          </Typography>
          <Button component={Link} href="/forgot-password" variant="contained" fullWidth>
            Request New Link
          </Button>
        </Paper>
      </Box>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/reset-password', { token, newPassword });
      setSuccess(data.message);
      setResetDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {resetDone ? (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Password Reset!</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your password has been updated. You can now sign in with your new password.
            </Typography>
            <Button component={Link} href="/login" variant="contained" fullWidth>
              Sign In
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Reset Password</Typography>
              <Typography color="text.secondary">Enter your new password below</Typography>
            </Box>

            {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
            {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}

            <form onSubmit={handleSubmit}>
              <AppTextField
                fullWidth
                label="New Password"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                sx={{ mb: 2.5 }}
              />
              <AppTextField
                fullWidth
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<LockResetIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
              <Link href="/login" style={{ color: '#ff5e2b', fontWeight: 600, textDecoration: 'none' }}>
                Back to Sign In
              </Link>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AppLoadingState message="Loading reset form..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
