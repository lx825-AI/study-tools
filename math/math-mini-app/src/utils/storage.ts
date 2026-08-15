/**
 * uni.storage 封装，提供 JSON 损坏降级（与 math-web storage.ts 逻辑一致）
 */
export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = uni.getStorageSync(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch {
    console.warn(`[math-miniapp] 无法写入 storage key="${key}"`)
  }
}

export function removeItem(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch {
    // 静默失败
  }
}
