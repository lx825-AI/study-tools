import type { ThemeMode } from '../data/types';
import '../styles/responsive.css';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
}

const ICONS: Record<ThemeMode, string> = {
  auto: '🌙',
  dark: '☀️',
  light: '🌙',
};

const LABELS: Record<ThemeMode, string> = {
  auto: '自动模式',
  dark: '暗色模式',
  light: '亮色模式',
};

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={`切换主题（当前：${LABELS[theme]}）(Alt+T)`}
      aria-label={`切换主题，当前${LABELS[theme]}`}
    >
      <span aria-hidden="true">{ICONS[theme]}</span>
    </button>
  );
}
