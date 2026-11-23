import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFavorites from '../hooks/useFavorites';

beforeEach(() => {
  localStorage.clear();
});

describe('useFavorites', () => {
  it('初始状态 favorites 为空', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites.size).toBe(0);
    expect(result.current.count).toBe(0);
  });

  it('toggle 添加后 favorites 中有对应 key', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle('calc-limit', 0));
    expect(result.current.has('calc-limit', 0)).toBe(true);
    expect(result.current.count).toBe(1);
  });

  it('toggle 两次删除该 key', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle('calc-limit', 0));
    act(() => result.current.toggle('calc-limit', 0));
    expect(result.current.has('calc-limit', 0)).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it('支持多条收藏', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle('calc-limit', 0));
    act(() => result.current.toggle('linalg-det', 3));
    expect(result.current.count).toBe(2);
    expect(result.current.has('calc-limit', 0)).toBe(true);
    expect(result.current.has('linalg-det', 3)).toBe(true);
  });

  it('持久化到 localStorage', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle('calc-limit', 0));

    const raw = localStorage.getItem('math-favorites');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual([{ sectionId: 'calc-limit', formulaIndex: 0 }]);
  });

  it('从 localStorage 恢复', () => {
    localStorage.setItem('math-favorites', JSON.stringify([
      { sectionId: 'calc-limit', formulaIndex: 0 },
      { sectionId: 'linalg-det', formulaIndex: 3 },
    ]));

    const { result } = renderHook(() => useFavorites());
    expect(result.current.count).toBe(2);
    expect(result.current.has('calc-limit', 0)).toBe(true);
    expect(result.current.has('linalg-det', 3)).toBe(true);
  });

  it('无效 JSON 时回退为空数组', () => {
    localStorage.setItem('math-favorites', 'invalid json{{');
    const { result } = renderHook(() => useFavorites());
    expect(result.current.count).toBe(0);
  });
});
