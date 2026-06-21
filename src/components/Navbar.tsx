'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Headphones, User, PlusCircle, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link href="/" className="logo" onClick={closeMenu}>
          <Headphones size={28} className="logo-icon" style={{ color: 'var(--accent)' }} />
          Bengali<span>boxd</span>
        </Link>

        {/* Mobile Hamburger toggle button */}
        <button 
          className="mobile-nav-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
          <li>
            <Link 
              href="/" 
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Stories
            </Link>
          </li>
          
          {user && (
            <li>
              <Link 
                href="/admin" 
                className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
                onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <PlusCircle size={16} />
                Add Story
              </Link>
            </li>
          )}

          {user ? (
            <li className="nav-user-info">
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
                  border: '1px solid var(--border-color)',
                  width: 'fit-content'
                }}
              >
                <User size={14} style={{ color: 'var(--accent)' }} />
                <span>{user.username}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary btn-icon" 
                title="Logout"
                style={{ width: '36px', height: '36px' }}
              >
                <LogOut size={16} />
              </button>
            </li>
          ) : (
            <li className="nav-auth-buttons">
              <Link 
                href="/login" 
                className="btn btn-secondary" 
                onClick={closeMenu}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <LogIn size={14} />
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="btn btn-primary" 
                onClick={closeMenu}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
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
