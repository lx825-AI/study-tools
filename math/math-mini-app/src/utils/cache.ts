/**
 * LRU 缓存（用于 Canvas 公式渲染结果缓存）
 */
export class LRUCache<K, V> {
  private map = new Map<K, V>()
  private readonly max: number

  constructor(max: number) {
    this.max = max
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key)!
    // 访问后移到末尾（最近使用）
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.max) {
      // 删除最旧的条目（Map 的第一个 key）
      const oldest = this.map.keys().next().value as K
      this.map.delete(oldest)
    }
    this.map.set(key, value)
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  clear(): void {
    this.map.clear()
  }

  get size(): number {
    return this.map.size
  }
}
