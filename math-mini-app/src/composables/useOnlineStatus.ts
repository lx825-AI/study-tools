/**
 * 网络状态检测：用于离线提示与触发同步重试。
 */
import { ref } from 'vue'

const isOnline = ref(true)
let listening = false

function ensureListener(): void {
  if (listening) return
  listening = true
  try {
    uni.getNetworkType({
      success: (res) => {
        isOnline.value = res.networkType !== 'none'
      },
    })
    uni.onNetworkStatusChange((res) => {
      isOnline.value = res.isConnected
    })
  } catch {
    // 不支持的环境默认可联网
  }
}

export function useOnlineStatus() {
  ensureListener()
  return { isOnline }
}
