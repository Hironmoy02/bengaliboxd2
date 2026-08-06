'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { BadgeDefinition } from '@/lib/badges';

const TIER: Record<string, { ring: string; glow: string; label: string; bg: string; border: string }> = {
  bronze:   { ring: '#cd7f32', glow: 'rgba(205,127,50,0.45)',  label: 'BRONZE',   bg: 'linear-gradient(160deg,#1f1510,#161210)', border: 'rgba(205,127,50,0.3)' },
  silver:   { ring: '#c0c0c0', glow: 'rgba(192,192,192,0.45)', label: 'SILVER',   bg: 'linear-gradient(160deg,#181c22,#121418)', border: 'rgba(192,192,192,0.3)' },
  gold:     { ring: '#ffd700', glow: 'rgba(255,215,0,0.45)',   label: 'GOLD',     bg: 'linear-gradient(160deg,#22200e,#18160c)', border: 'rgba(255,215,0,0.3)' },
  legendary:{ ring: '#00e5ff', glow: 'rgba(0,229,255,0.45)',   label: 'LEGENDARY',bg: 'linear-gradient(160deg,#0c1a24,#0e141c)', border: 'rgba(0,229,255,0.3)' },
};

interface Props { badge: BadgeDefinition; onDone: () => void; }

export default function BadgeUnlockToast({ badge, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in');
  const t = TIER[badge.tier] || TIER.bronze;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 60);
    const t2 = setTimeout(() => setPhase('out'), 5200);
    const t3 = setTimeout(onDone, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const vis = phase === 'show';

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {/* dim */}
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)', opacity: vis ? 1 : 0, transition: 'opacity .4s ease' }} />

      {/* glow aura */}
      <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle,${t.glow},transparent 70%)`, filter: 'blur(36px)', opacity: vis ? .7 : 0, transition: 'opacity .7s ease', animation: vis ? 'badgePulse 2.4s ease-in-out infinite' : 'none' }} />

      {/* card */}
      <Box
        sx={{
          position: 'relative',
          pointerEvents: 'auto',
          mx: 2,
          width: '100%',
          maxWidth: 300,
          borderRadius: 3,
          bgcolor: t.bg,
          border: `1px solid ${t.border}`,
          boxShadow: `0 16px 48px rgba(0,0,0,.6),0 0 0 1px ${t.border},inset 0 1px 0 rgba(255,255,255,.04)`,
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          overflow: 'hidden',
          opacity: phase === 'in' ? 0 : phase === 'out' ? 0 : 1,
          transform: phase === 'in' ? 'scale(.7) translateY(20px)' : phase === 'out' ? 'scale(.9) translateY(-16px)' : 'scale(1) translateY(0)',
          transition: 'all .55s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* top accent line */}
        <Box sx={{ height: 2, background: `linear-gradient(90deg,transparent,${t.ring},transparent)`, opacity: vis ? 1 : 0, transition: 'opacity .5s ease' }} />

        <Box sx={{ px: 3, py: 3 }}>
          {/* icon */}
          <Box sx={{ fontSize: 48, lineHeight: 1, mb: 1, animation: vis ? 'badgeBounceIn .65s cubic-bezier(.34,1.56,.64,1)' : 'none', filter: `drop-shadow(0 0 16px ${t.glow})` }}>
            {badge.icon}
          </Box>

          {/* tier chip */}
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              fontSize: '0.55rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: t.ring,
              bgcolor: `${t.ring}15`,
              border: `1px solid ${t.ring}33`,
              borderRadius: '9999px',
              px: 1.5,
              py: '2px',
              mb: 1,
            }}
          >
            {t.label}
          </Box>

          {/* title */}
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, fontFamily: 'var(--font-sans)' }}>
            {badge.titleBn}
          </Typography>

          {/* desc */}
          <Typography sx={{ fontSize: '0.73rem', color: 'rgba(255,255,255,.5)', mt: 0.75, lineHeight: 1.4, fontFamily: 'var(--font-sans)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {badge.descriptionBn}
          </Typography>

          {/* points */}
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: t.ring, mt: 1.25, fontFamily: 'var(--font-sans)' }}>
            +{badge.pointsBonus} রসগোল্লা
          </Typography>
        </Box>

        {/* sparkles */}
        {vis && [...Array(5)].map((_, i) => (
          <Box key={i} sx={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', bgcolor: t.ring, top: `${20 + i * 14}%`, left: i % 2 === 0 ? '8%' : '88%', opacity: 0, animation: `sparkle ${1.3 + i * .25}s ${i * .18}s ease-in-out infinite` }} />
        ))}
      </Box>
    </Box>
  );
}
