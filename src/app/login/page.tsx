'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(emailOrUsername, password);
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
    <div className="container flex-center" style={{ minHeight: '80vh', padding: '40px 20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.95rem' }}>Log in to rate and review your favorite audio stories</p>
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
            <label className="form-label" htmlFor="emailOrUsername">Username or Email</label>
            <input
              type="text"
              id="emailOrUsername"
              className="form-input"
              placeholder="e.g. somak_fan or user@example.com"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px' }}
            disabled={isSubmitting}
          >
            <LogIn size={16} />
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
