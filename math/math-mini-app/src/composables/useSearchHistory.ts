/**
 * 搜索历史：上限 10 条，最新在前（纯本地）。
 */
import { ref } from 'vue'
import { getItem, setItem } from '@/utils/storage'

const KEY = 'math:search-history'
const MAX = 10

const history = ref<string[]>(getItem<string[]>(KEY, []))

export function useSearchHistory() {
  const add = (query: string) => {
    const q = query.trim()
    if (!q) return
    const next = history.value.filter((h) => h !== q)
    next.unshift(q)
    if (next.length > MAX) next.pop()
    history.value = next
    setItem(KEY, next)
  }

  const clear = () => {
    history.value = []
    setItem(KEY, [])
  }

  return { history, add, clear }
}
