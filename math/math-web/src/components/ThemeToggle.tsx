import type { ThemeMode } from '../data/types';
import { THEME_LABELS } from '../hooks/useTheme';
import '../styles/responsive.css';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

const ICONS: Record<ThemeMode, string> = {
  auto: '🌓',
  dark: '🌙',
  light: '☀️',
};

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={`切换主题（当前：${THEME_LABELS[theme]}）(Alt+T)`}
      aria-label={`切换主题，当前${THEME_LABELS[theme]}`}
    >
      <span aria-hidden="true">{ICONS[theme]}</span>
    </button>
  );
}
