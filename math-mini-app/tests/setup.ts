import { vi } from 'vitest'

/**
 * uni API 的 node 环境模拟：Map 存储 + 浅色系统主题。
 * 在 import composables（模块级读 storage）之前由 vitest setupFiles 加载。
 */
const storageMap = new Map<string, string>()

const uniMock = {
  getStorageSync: (key: string) => storageMap.get(key) ?? '',
  setStorageSync: (key: string, value: string) => void storageMap.set(key, String(value)),
  removeStorageSync: (key: string) => void storageMap.delete(key),
  getSystemInfoSync: () => ({ theme: 'light', pixelRatio: 2 }),
  getWindowInfo: () => ({ pixelRatio: 2 }),
  getNetworkType: ({ success }: { success?: (r: { networkType: string }) => void } = {}) =>
    success?.({ networkType: 'wifi' }),
  onNetworkStatusChange: () => {},
  showToast: () => {},
  setClipboardData: () => {},
  __clear: () => storageMap.clear(),
}

vi.stubGlobal('uni', uniMock)

export { uniMock, storageMap }
