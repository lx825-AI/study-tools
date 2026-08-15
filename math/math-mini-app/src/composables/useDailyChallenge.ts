/**
 * 每日挑战：每日 5 题 + 连续打卡天数 + 成就 emoji 阶梯（3/7/14/30 天）。
 */
import { ref, computed } from 'vue'
import { getItem, setItem } from '@/utils/storage'
import { GRADE } from '@/utils/keys'
import { syncer } from '@/services/sync'

const KEY = 'math:daily-challenge'

interface DailyState {
  date: string // YYYY-MM-DD
  completed: boolean
  score: number
  total: number
  streak: number
  lastCompletedDate: string
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EMPTY: DailyState = { date: '', completed: false, score: 0, total: 5, streak: 0, lastCompletedDate: '' }

function loadToday(): DailyState {
  const today = dateStr(new Date())
  const saved = getItem<DailyState>(KEY, EMPTY)
  if (saved.date === today) return saved
  // 日期变了：重置完成状态；上次完成是昨天则保留 streak，否则清零
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const streak = saved.lastCompletedDate === dateStr(yesterday) ? saved.streak : 0
  const fresh: DailyState = { ...EMPTY, date: today, streak, lastCompletedDate: saved.lastCompletedDate }
  setItem(KEY, fresh)
  return fresh
}

const state = ref<DailyState>(loadToday())

export function useDailyChallenge() {
  const completeChallenge = (score: number, total: number) => {
    const today = dateStr(new Date())
    state.value = {
      date: today,
      completed: true,
      score,
      total,
      streak: state.value.streak + 1,
      lastCompletedDate: today,
    }
    setItem(KEY, state.value)
    syncer.write('daily_challenges', {
      _id: `${GRADE}_${today}`,
      date: today,
      score,
      total,
      streak: state.value.streak,
    })
  }

  const emoji = computed(() => {
    const s = state.value.streak
    if (s >= 30) return '🔥'
    if (s >= 14) return '⭐'
    if (s >= 7) return '💪'
    if (s >= 3) return '📚'
    return ''
  })

  return {
    state,
    isCompleted: computed(() => state.value.completed),
    streak: computed(() => state.value.streak),
    today: computed(() => state.value.date),
    emoji,
    completeChallenge,
  }
}
