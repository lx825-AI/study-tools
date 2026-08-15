/**
 * 页面查询参数：onLoad 读取（MP 每次新页面实例）+ onShow 从 URL 同步（H5）。
 * 解决 H5 同一路由不同参数导航时组件复用导致的参数过期问题：
 * H5 端 getCurrentPages() 状态不可靠，直接解析 location.hash。
 */
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

export function usePageQuery() {
  const query = ref<Record<string, string>>({})

  const readFromUrl = () => {
    // #ifdef H5
    const hash = location.hash
    const qi = hash.indexOf('?')
    if (qi < 0) return
    const params = new URLSearchParams(hash.slice(qi + 1))
    const obj: Record<string, string> = {}
    params.forEach((v, k) => {
      obj[k] = v
    })
    query.value = obj
    // #endif
  }

  onLoad((q) => {
    if (q) query.value = { ...(q as Record<string, string>) }
  })
  onShow(readFromUrl)

  return query
}
