'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Box, Typography, Button, Paper } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { AppTextField, AppAlert } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email'); return; }
    setError(''); setSuccess(''); setIsSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSuccess(data.message);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', px: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {sent ? (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Check Your Email</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox and spam folder.
            </Typography>
            <Button component={Link} href="/login" variant="contained" fullWidth>
              Back to Sign In
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Forgot Password?</Typography>
              <Typography color="text.secondary">Enter your email and we&apos;ll send you a reset link</Typography>
            </Box>

            {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
            {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}

            <form onSubmit={handleSubmit}>
              <AppTextField
                fullWidth
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<EmailIcon />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
              <Link href="/login" style={{ color: '#ff5e2b', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowBackIcon sx={{ fontSize: 14 }} /> Back to Sign In
              </Link>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
