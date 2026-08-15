/**
 * useSearch 测试：验证方案验收标准 —— 搜索"极限"能返回 calc-limit 章节的公式
 */
import { describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearch } from '@/composables/useSearch'

describe('useSearch', () => {
  it('搜索"极限"返回 calc-limit 章节公式（300ms 防抖后）', async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    const { setQuery, results, isSearching } = useSearch()
    expect(isSearching.value).toBe(false)
    setQuery('极限')
    vi.advanceTimersByTime(350)
    expect(isSearching.value).toBe(true)
    expect(results.value.length).toBeGreaterThan(0)
    expect(results.value.some((r) => r.sectionId === 'calc-limit')).toBe(true)
    vi.useRealTimers()
  })

  it('学科筛选生效', async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    const { setQuery, results, subjectFilter } = useSearch()
    subjectFilter.value = 'linalg'
    setQuery('矩阵')
    vi.advanceTimersByTime(350)
    expect(results.value.length).toBeGreaterThan(0)
    expect(results.value.every((r) => r.sectionId.startsWith('linalg'))).toBe(true)
    vi.useRealTimers()
  })

  it('难度筛选：无 level 的公式不被过滤', async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    const { setQuery, results, levelFilter } = useSearch()
    levelFilter.value = 'important'
    setQuery('积分')
    vi.advanceTimersByTime(350)
    expect(results.value.length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('空查询返回空结果', () => {
    setActivePinia(createPinia())
    const { results } = useSearch()
    expect(results.value).toEqual([])
  })
})
