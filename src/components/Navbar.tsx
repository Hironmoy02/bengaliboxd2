'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Headphones, User, PlusCircle, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link href="/" className="logo">
          <Headphones size={28} className="logo-icon" style={{ color: 'var(--accent)' }} />
          Bengali<span>boxd</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              Stories
            </Link>
          </li>
          
          {user && (
            <li>
              <Link 
                href="/admin" 
                className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <PlusCircle size={16} />
                Add Story
              </Link>
            </li>
          )}

          {user ? (
            <li style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                className="user-badge" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-tertiary)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <User size={14} style={{ color: 'var(--accent)' }} />
                <span>{user.username}</span>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-secondary btn-icon" 
                title="Logout"
                style={{ width: '36px', height: '36px' }}
              >
                <LogOut size={16} />
              </button>
            </li>
          ) : (
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <LogIn size={14} />
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <UserPlus size={14} />
                Sign Up
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
