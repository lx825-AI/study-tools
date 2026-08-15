/**
 * 触底加载：pageCount 递增，sliced() 按页裁切数组。
 * 搭配页面 onReachBottom 生命周期使用。
 */
import { ref, watch } from 'vue'

export function useInfiniteScroll(pageSize = 10) {
  const pageCount = ref(1)
  const totalKey = ref(0) // 数据源变化时重置计数器

  const reset = () => {
    pageCount.value = 1
  }

  const loadMore = (currentCount: number, total: number) => {
    if (currentCount >= total) return
    pageCount.value++
  }

  const sliced = <T>(items: T[],): T[] => items.slice(0, pageSize * pageCount.value)

  return { pageCount, reset, loadMore, sliced }
}
