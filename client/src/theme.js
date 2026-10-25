import { useEffect, useState } from 'react';

// Dark / light theme hook (saved in localStorage)
const getInitial = () => {
  try {
    const saved = localStorage.getItem('ss_theme');
    if (saved) return saved;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function useTheme() {
  const [theme, setTheme] = useState(getInitial);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('ss_theme', theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}
