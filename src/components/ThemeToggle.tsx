"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-surface-2 w-10 h-10" aria-label="Loading theme">
        <span className="opacity-50">◐</span>
      </button>
    );
  }
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface-2 hover:bg-border transition-colors w-full flex items-center gap-2 text-text-muted hover:text-text"
      aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="text-lg">
        {currentTheme === 'dark' ? '☀️' : '🌙'}
      </span>
      <span className="hidden md:block text-sm">
        {currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
}
