'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  toggleTheme: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

let currentMode: ThemeMode = 'dark';

function getSnapshot(): ThemeMode {
  return currentMode;
}

function getServerSnapshot(): ThemeMode {
  return 'dark';
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

const listeners = new Set<() => void>();

function setMode(mode: ThemeMode) {
  currentMode = mode;
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme-mode', mode);
  listeners.forEach((l) => l());
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
  if (stored === 'light' || stored === 'dark') {
    currentMode = stored;
  }
  document.documentElement.setAttribute('data-theme', currentMode);
}
