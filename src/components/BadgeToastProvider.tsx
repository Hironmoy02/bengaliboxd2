'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import BadgeUnlockToast from '@/components/ui/BadgeUnlockToast';
import { BadgeDefinition, BADGES } from '@/lib/badges';

export default function BadgeToastProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<BadgeDefinition | null>(null);
  const queueRef = useRef<BadgeDefinition[]>([]);
  const processedIds = useRef(new Set<string>());
  const tickRef = useRef(0);

  const processNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      setActive(null);
      return;
    }
    const next = queueRef.current.shift()!;
    tickRef.current += 1;
    setActive(next);
  }, []);

  useEffect(() => {
    const handleGamification = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.newlyUnlockedBadges?.length) return;

      let shouldStart = false;
      for (const b of detail.newlyUnlockedBadges) {
        const badgeId = b.id;
        if (processedIds.current.has(badgeId)) continue;
        processedIds.current.add(badgeId);
        const def = BADGES.find((bd) => bd.id === badgeId);
        if (!def) continue;
        queueRef.current.push(def);
        shouldStart = true;
      }

      if (shouldStart && !active) {
        processNext();
      }
    };

    window.addEventListener('gamificationUpdated', handleGamification);
    return () => window.removeEventListener('gamificationUpdated', handleGamification);
  }, [active, processNext]);

  const handleDone = useCallback(() => {
    processNext();
  }, [processNext]);

  return (
    <>
      {children}
      {active && (
        <BadgeUnlockToast
          key={`${active.id}-${tickRef.current}`}
          badge={active}
          onDone={handleDone}
        />
      )}
    </>
  );
}
