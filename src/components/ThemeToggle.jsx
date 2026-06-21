import { useEffect, useState } from 'react';
import { getTheme, saveTheme } from '../services/storage.js';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    saveTheme(theme);
    const root = document.documentElement;
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      
      const listener = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.1)', padding: 4, borderRadius: 20 }}>
      {['light', 'system', 'dark'].map((t) => {
        const icons = { light: '☀️', system: '💻', dark: '🌙' };
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            aria-label={`Set theme to ${t}`}
            style={{
              width: 28, height: 28,
              borderRadius: '50%', border: 'none',
              background: theme === t ? '#fff' : 'transparent',
              color: theme === t ? '#000' : 'rgba(255,255,255,0.7)',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: theme === t ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {icons[t]}
          </button>
        )
      })}
    </div>
  );
}
