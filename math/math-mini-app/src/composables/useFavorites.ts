/**
 * 收藏系统：本地 Set 即时生效 + 云端幂等同步（墓碑删除）。
 * 共享单例：所有页面读写同一份状态。
 */
import { ref, computed } from 'vue'
import { getItem, setItem } from '@/utils/storage'
import { formulaKey, parseFormulaKey, cloudKey } from '@/utils/keys'
import { syncer } from '@/services/sync'
import type { FavoriteEntry } from '@/data/types'

const KEY = 'math:favorites'

function load(): Set<string> {
  const list = getItem<FavoriteEntry[]>(KEY, [])
  return new Set(list.map((f) => formulaKey(f.sectionId, f.formulaIndex)))
}

function persist(set: Set<string>): void {
  const list: FavoriteEntry[] = [...set].map(parseFormulaKey)
  setItem(KEY, list)
}

const favorites = ref<Set<string>>(load())

export function useFavorites() {
  const has = (sectionId: string, index: number) => favorites.value.has(formulaKey(sectionId, index))

  const toggle = (sectionId: string, index: number) => {
    const key = formulaKey(sectionId, index)
    const next = new Set(favorites.value)
    const added = !next.has(key)
    if (added) next.add(key)
    else next.delete(key)
    favorites.value = next
    persist(next)
    syncer.write('favorites', {
      _id: cloudKey(sectionId, index),
      sectionId,
      formulaIndex: index,
      deleted: !added,
    })
  }

  /** 收藏条目列表（按加入顺序） */
  const list = computed<FavoriteEntry[]>(() => [...favorites.value].map(parseFormulaKey))

  return { favorites, has, toggle, list, count: computed(() => favorites.value.size) }
}

// 远端增量合并：他端收藏/取消同步到本端
syncer.subscribe((collection, docs) => {
  if (collection !== 'favorites') return
  const next = new Set(favorites.value)
  for (const d of docs) {
    const key = formulaKey(d.sectionId as string, d.formulaIndex as number)
    if (d.deleted) next.delete(key)
    else next.add(key)
  }
  favorites.value = next
  persist(next)
})
