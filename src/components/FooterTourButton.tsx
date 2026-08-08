'use client';

import React from 'react';

export default function FooterTourButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('startUserTour'));
        }
      }}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--accent, #ff5e2b)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        padding: 0,
        textDecoration: 'underline',
      }}
    >
      Take Tour Guide 🧭
    </button>
  );
}
