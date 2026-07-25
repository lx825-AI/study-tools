/**
 * 学习进度：记录每章节已浏览的公式索引，云端合并策略为并集。
 */
import { ref } from 'vue'
import { getItem, setItem } from '@/utils/storage'
import { GRADE } from '@/utils/keys'
import { syncer } from '@/services/sync'

const KEY = 'math:progress'

type ProgressMap = Record<string, number[]>

const progress = ref<ProgressMap>(getItem<ProgressMap>(KEY, {}))

function persist(): void {
  setItem(KEY, progress.value)
}

export function useProgress() {
  const markViewed = (sectionId: string, index: number) => {
    const viewed = progress.value[sectionId] ?? []
    if (viewed.includes(index)) return
    progress.value = { ...progress.value, [sectionId]: [...viewed, index] }
    persist()
    syncer.write('progress', {
      _id: `${GRADE}_${sectionId}`,
      sectionId,
      viewedFormulas: progress.value[sectionId],
    })
  }

  /** 章节进度百分比（0-100） */
  const getPercent = (sectionId: string, total: number): number => {
    if (total <= 0) return 0
    return Math.round(((progress.value[sectionId]?.length ?? 0) / total) * 100)
  }

  const viewedCount = (sectionId: string): number => progress.value[sectionId]?.length ?? 0

  const reset = () => {
    progress.value = {}
    persist()
  }

  return { progress, markViewed, getPercent, viewedCount, reset }
}

// 远端增量合并：两端的已浏览列表取并集
syncer.subscribe((collection, docs) => {
  if (collection !== 'progress') return
  const next = { ...progress.value }
  for (const d of docs) {
    const sid = d.sectionId as string
    const remote = (d.viewedFormulas as number[]) ?? []
    const local = next[sid] ?? []
    next[sid] = [...new Set([...local, ...remote])].sort((a, b) => a - b)
  }
  progress.value = next
  persist()
})
