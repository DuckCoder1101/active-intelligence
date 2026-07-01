import { useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import { ThemeContext } from '@/contexts/theme.context';
import type { Theme } from '@/contexts/theme.context';

interface ThemeProviderProps {
  children: ReactNode;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return (localStorage.getItem('theme') as Theme) ?? 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function setStoredTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Atualiza o tema no body
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setStoredTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
