import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useSearch from '../hooks/useSearch';

describe('useSearch', () => {
  it('初始状态 query 为空，不处于搜索状态', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.query).toBe('');
    expect(result.current.isSearching).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('setQuery 立即更新 query', () => {
    const { result } = renderHook(() => useSearch());
    act(() => { result.current.setQuery('极限'); });
    expect(result.current.query).toBe('极限');
  });

  it('sortBySection 默认为 true', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.sortBySection).toBe(true);
  });

  it('toggleSort 切换排序模式', () => {
    const { result } = renderHook(() => useSearch());
    act(() => { result.current.toggleSort(); });
    expect(result.current.sortBySection).toBe(false);
    act(() => { result.current.toggleSort(); });
    expect(result.current.sortBySection).toBe(true);
  });

  it('subjectFilter 默认为空', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.subjectFilter).toBe('');
  });

  it('setSubjectFilter 更新科目筛选', () => {
    const { result } = renderHook(() => useSearch());
    act(() => { result.current.setSubjectFilter('calc-'); });
    expect(result.current.subjectFilter).toBe('calc-');
  });

  it('levelFilter 默认为空', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.levelFilter).toBe('');
  });

  it('setLevelFilter 更新难度筛选', () => {
    const { result } = renderHook(() => useSearch());
    act(() => { result.current.setLevelFilter('important'); });
    expect(result.current.levelFilter).toBe('important');
  });
});
