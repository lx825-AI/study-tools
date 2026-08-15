/**
 * 全文搜索：预建扁平索引 + 300ms 防抖 + 学科/难度筛选（方案 8.1）。
 * 从 math-web useSearch.ts 移植，searchText 在 store 初始化时预计算。
 */
import { ref, computed } from 'vue'
import { useFormulaStore } from '@/stores/formulas'

export interface SearchResult {
  sectionId: string
  sectionTitle: string
  formulaIndex: number
}

export function useSearch() {
  const store = useFormulaStore()
  const query = ref('')
  const debouncedQuery = ref('')
  const subjectFilter = ref('') // 学科前缀（sectionId 前缀，如 calc / linalg）
  const levelFilter = ref('')
  const sortBySection = ref(true)
  let timer: ReturnType<typeof setTimeout> | null = null

  const setQuery = (q: string) => {
    query.value = q
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = q.trim().toLowerCase()
    }, 300)
  }

  const isSearching = computed(() => debouncedQuery.value.length > 0)

  const results = computed<SearchResult[]>(() => {
    const q = debouncedQuery.value
    if (!q) return []
    const list: SearchResult[] = []
    for (const item of store.flatIndex) {
      if (subjectFilter.value && !item.sectionId.startsWith(subjectFilter.value)) continue
      // 无 level 标签的公式不被难度筛选过滤（与 math-web 行为一致）
      if (levelFilter.value && item.level && item.level !== levelFilter.value) continue
      if (item.searchText.includes(q)) {
        list.push({
          sectionId: item.sectionId,
          sectionTitle: item.sectionTitle,
          formulaIndex: item.index,
        })
      }
    }
    if (sortBySection.value) {
      list.sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.formulaIndex - b.formulaIndex)
    }
    return list
  })

  /** 搜索建议：公式名以 query 开头的前 N 条 */
  const suggestions = computed<string[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (q.length < 1) return []
    const seen = new Set<string>()
    for (const item of store.flatIndex) {
      const name = item.searchText.split(' ')[0]
      if (name.startsWith(q) && !seen.has(name)) {
        seen.add(name)
        if (seen.size >= 6) break
      }
    }
    return [...seen]
  })

  const toggleSort = () => {
    sortBySection.value = !sortBySection.value
  }

  return {
    query,
    setQuery,
    results,
    isSearching,
    suggestions,
    subjectFilter,
    levelFilter,
    sortBySection,
    toggleSort,
  }
}
