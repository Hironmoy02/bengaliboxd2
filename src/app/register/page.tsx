'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { registerUser } from '@/store/authSlice';
import { Box, Typography, Button, Paper } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { AppTextField, AppAlert, AppLoadingState } from '@/components/ui';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (!username || !email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters long'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(registerUser({ username, email, password }));
      if (registerUser.rejected.match(result)) {
        setError((result.payload as string) || 'Registration failed');
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', px: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 440, p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Create Account</Typography>
          <Typography color="text.secondary">Join Bengaliboxd to rate, review and list audio stories</Typography>
        </Box>

        {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <AppTextField fullWidth label="Username" placeholder="e.g. somak_fan" value={username} onChange={(e) => setUsername(e.target.value)} required sx={{ mb: 2.5 }} />
          <AppTextField fullWidth label="Email Address" type="email" placeholder="e.g. yourname@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2.5 }} />
          <AppTextField fullWidth label="Password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 2.5 }} />
          <AppTextField fullWidth label="Confirm Password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<PersonAddIcon />} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-on-dark)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
