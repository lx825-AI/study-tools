/**
 * 最近浏览：上限 20 条，最新在前（纯本地，不同步云端）。
 */
import { ref } from 'vue'
import { getItem, setItem } from '@/utils/storage'
import type { FavoriteEntry } from '@/data/types'

const KEY = 'math:recent'
const MAX = 20

const recent = ref<FavoriteEntry[]>(getItem<FavoriteEntry[]>(KEY, []))

export function useRecent() {
  const add = (sectionId: string, index: number) => {
    const next = recent.value.filter(
      (r) => !(r.sectionId === sectionId && r.formulaIndex === index)
    )
    next.unshift({ sectionId, formulaIndex: index })
    if (next.length > MAX) next.pop()
    recent.value = next
    setItem(KEY, next)
  }

  const clear = () => {
    recent.value = []
    setItem(KEY, [])
  }

  return { recent, add, clear }
}
