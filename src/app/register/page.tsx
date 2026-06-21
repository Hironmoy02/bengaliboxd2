'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, register, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await register(username, email, password);
      if (res.error) {
        setError(res.error);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="container flex-center" style={{ minHeight: '90vh', padding: '40px 20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ fontSize: '0.95rem' }}>Join Bengaliboxd to rate, review and list audio stories</p>
        </div>

        {error && (
          <div 
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid var(--danger)', 
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="e.g. somak_fan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="e.g. yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px' }}
            disabled={isSubmitting}
          >
            <UserPlus size={16} />
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
