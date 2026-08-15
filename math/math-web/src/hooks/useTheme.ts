import { useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '../data/types';

export const THEME_LABELS: Record<ThemeMode, string> = {
  auto: '自动模式',
  dark: '暗色模式',
  light: '亮色模式',
};

const STORAGE_KEY = 'math-theme';

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored;
  return 'auto';
}

export default function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);

  const applyTheme = useCallback((mode: ThemeMode) => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    if (mode === 'dark') {
      html.classList.add('dark');
    } else if (mode === 'light') {
      html.classList.add('light');
    }
    // 'auto': no class, handled by matchMedia listener
  }, []);

  const cycleTheme = useCallback(() => {
    const themes: ThemeMode[] = ['auto', 'dark', 'light'];
    const current = getStoredTheme();
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
    return next;
  }, [applyTheme]);

  // 应用初始主题
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // 监听系统主题变化（auto 模式）
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getStoredTheme() === 'auto') {
        const html = document.documentElement;
        html.classList.toggle('dark', mq.matches);
      }
    };
    mq.addEventListener('change', handler);
    // 初始化时也应用一次
    if (getStoredTheme() === 'auto') {
      document.documentElement.classList.toggle('dark', mq.matches);
    }
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { theme, cycleTheme, themeLabel: THEME_LABELS };
}
