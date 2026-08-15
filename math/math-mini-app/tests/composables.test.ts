/**
 * composables 测试：模块单例通过 resetModules + 清空存储获得干净状态
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { uniMock } from './setup'

async function fresh<T = Record<string, unknown>>(path: string): Promise<T> {
  vi.resetModules()
  return (await import(path)) as T
}

beforeEach(() => {
  uniMock.__clear()
})

describe('useFavorites', () => {
  it('toggle 收藏/取消并持久化', async () => {
    const { useFavorites } = await fresh<typeof import('@/composables/useFavorites')>(
      '@/composables/useFavorites'
    )
    const { has, toggle, count } = useFavorites()
    expect(has('calc-limit', 0)).toBe(false)
    toggle('calc-limit', 0)
    expect(has('calc-limit', 0)).toBe(true)
    expect(count.value).toBe(1)
    toggle('calc-limit', 0)
    expect(has('calc-limit', 0)).toBe(false)
  })

  it('重新导入后从存储恢复', async () => {
    const m1 = await fresh<typeof import('@/composables/useFavorites')>('@/composables/useFavorites')
    m1.useFavorites().toggle('calc-limit', 3)
    const m2 = await fresh<typeof import('@/composables/useFavorites')>('@/composables/useFavorites')
    expect(m2.useFavorites().has('calc-limit', 3)).toBe(true)
  })
})

describe('useRecent', () => {
  it('最新在前、去重、上限 20', async () => {
    const { useRecent } = await fresh<typeof import('@/composables/useRecent')>('@/composables/useRecent')
    const { recent, add } = useRecent()
    for (let i = 0; i < 25; i++) add('calc-limit', i)
    expect(recent.value.length).toBe(20)
    expect(recent.value[0].formulaIndex).toBe(24)
    add('calc-limit', 10) // 已存在 → 提前并去重
    expect(recent.value[0].formulaIndex).toBe(10)
    expect(recent.value.filter((r) => r.formulaIndex === 10).length).toBe(1)
  })
})

describe('useProgress', () => {
  it('markViewed 去重并计算百分比', async () => {
    const { useProgress } = await fresh<typeof import('@/composables/useProgress')>(
      '@/composables/useProgress'
    )
    const { markViewed, getPercent, viewedCount } = useProgress()
    markViewed('calc-limit', 0)
    markViewed('calc-limit', 0)
    markViewed('calc-limit', 1)
    expect(viewedCount('calc-limit')).toBe(2)
    expect(getPercent('calc-limit', 9)).toBe(22)
  })
})

describe('useNotes', () => {
  it('设置/读取/清空笔记', async () => {
    const { useNotes } = await fresh<typeof import('@/composables/useNotes')>('@/composables/useNotes')
    const { getNote, setNote, hasNote } = useNotes()
    setNote('calc-limit', 0, '  重要极限  ')
    expect(getNote('calc-limit', 0)).toBe('  重要极限  ')
    expect(hasNote('calc-limit', 0)).toBe(true)
    setNote('calc-limit', 0, '   ')
    expect(hasNote('calc-limit', 0)).toBe(false)
  })
})

describe('useSearchHistory', () => {
  it('上限 10 条、去重置顶', async () => {
    const { useSearchHistory } = await fresh<typeof import('@/composables/useSearchHistory')>(
      '@/composables/useSearchHistory'
    )
    const { history, add } = useSearchHistory()
    for (let i = 0; i < 12; i++) add(`q${i}`)
    expect(history.value.length).toBe(10)
    add('q5')
    expect(history.value[0]).toBe('q5')
    expect(history.value.filter((h) => h === 'q5').length).toBe(1)
    add('   ')
    expect(history.value.length).toBe(10) // 空白不入历史
  })
})

describe('usePractice', () => {
  it('选择题构建：4 选项、恰好 1 个正确', async () => {
    const { usePractice } = await fresh<typeof import('@/composables/usePractice')>(
      '@/composables/usePractice'
    )
    const p = usePractice(ref(new Set<string>()))
    p.count.value = 10
    p.startQuiz()
    expect(p.phase.value).toBe('quiz')
    expect(p.questions.value.length).toBe(10)
    for (const q of p.questions.value) {
      expect(q.options.length).toBe(4)
      expect(q.options.filter((o) => o.correct).length).toBe(1)
      // 干扰项不与正确项同名公式（latex 不重复）
      expect(new Set(q.options.map((o) => o.latex)).size).toBe(4)
    }
  })

  it('答错写入错题本并推进题目', async () => {
    vi.useFakeTimers()
    const { usePractice, loadMistakes } = await fresh<typeof import('@/composables/usePractice')>(
      '@/composables/usePractice'
    )
    const p = usePractice(ref(new Set<string>()))
    p.count.value = 5
    p.startQuiz()
    const wrongIdx = p.questions.value[0].options.findIndex((o) => !o.correct)
    p.handleMcqAnswer(wrongIdx)
    expect(p.score.value).toBe(0)
    expect(loadMistakes().length).toBe(1)
    vi.advanceTimersByTime(1900)
    expect(p.qIndex.value).toBe(1)
    vi.useRealTimers()
  })

  it('全部答完进入 result 并保存成绩', async () => {
    vi.useFakeTimers()
    const { usePractice, loadScores } = await fresh<typeof import('@/composables/usePractice')>(
      '@/composables/usePractice'
    )
    const p = usePractice(ref(new Set<string>()))
    p.count.value = 3
    p.startQuiz()
    for (let i = 0; i < 3; i++) {
      const correctIdx = p.questions.value[p.qIndex.value].options.findIndex((o) => o.correct)
      p.handleMcqAnswer(correctIdx)
      vi.advanceTimersByTime(900)
    }
    expect(p.phase.value).toBe('result')
    expect(p.score.value).toBe(3)
    expect(loadScores()).toEqual([100])
    vi.useRealTimers()
  })
})

describe('useDailyChallenge', () => {
  it('完成后 streak +1 且当日标记完成', async () => {
    const { useDailyChallenge } = await fresh<typeof import('@/composables/useDailyChallenge')>(
      '@/composables/useDailyChallenge'
    )
    const { isCompleted, streak, completeChallenge } = useDailyChallenge()
    expect(isCompleted.value).toBe(false)
    completeChallenge(4, 5)
    expect(isCompleted.value).toBe(true)
    expect(streak.value).toBe(1)
  })

  it('昨日完成则 streak 延续，否则清零', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    uniMock.setStorageSync(
      'math:daily-challenge',
      JSON.stringify({ date: yStr, completed: true, score: 5, total: 5, streak: 7, lastCompletedDate: yStr })
    )
    const m = await fresh<typeof import('@/composables/useDailyChallenge')>(
      '@/composables/useDailyChallenge'
    )
    expect(m.useDailyChallenge().streak.value).toBe(7)
    expect(m.useDailyChallenge().emoji.value).toBe('💪')

    // 断档场景
    uniMock.__clear()
    uniMock.setStorageSync(
      'math:daily-challenge',
      JSON.stringify({ date: '2020-01-01', completed: true, score: 5, total: 5, streak: 30, lastCompletedDate: '2020-01-01' })
    )
    const m2 = await fresh<typeof import('@/composables/useDailyChallenge')>(
      '@/composables/useDailyChallenge'
    )
    expect(m2.useDailyChallenge().streak.value).toBe(0)
  })
})
