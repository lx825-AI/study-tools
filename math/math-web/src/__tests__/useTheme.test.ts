import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTheme from '../hooks/useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

describe('useTheme', () => {
  it('默认主题为 auto', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('auto');
  });

  it('cycleTheme 循环 auto → dark → light → auto', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('auto');

    act(() => { result.current.cycleTheme(); });
    expect(result.current.theme).toBe('dark');

    act(() => { result.current.cycleTheme(); });
    expect(result.current.theme).toBe('light');

    act(() => { result.current.cycleTheme(); });
    expect(result.current.theme).toBe('auto');
  });

  it('dark 模式下 html 有 .dark 类', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.cycleTheme(); }); // auto → dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('light 模式下 html 有 .light 类', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.cycleTheme(); }); // auto → dark
    act(() => { result.current.cycleTheme(); }); // dark → light
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('持久化到 localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.cycleTheme(); });
    expect(localStorage.getItem('math-theme')).toBe('dark');
  });

  it('从 localStorage 恢复主题', () => {
    localStorage.setItem('math-theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('themeLabel 返回正确标签', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeLabel.auto).toBe('自动模式');
    expect(result.current.themeLabel.dark).toBe('暗色模式');
    expect(result.current.themeLabel.light).toBe('亮色模式');
  });
});
