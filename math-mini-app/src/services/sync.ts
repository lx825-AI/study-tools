/**
 * DataSyncer 数据同步引擎（方案 6.3）。
 * 核心原则：本地优先 —— 写入先落本地存储并立即更新 UI，操作入离线队列，
 * 300ms 防抖批量 flush 到云端；失败重入队，网络恢复自动重试。
 * 删除采用墓碑标记（deleted: true），保证多设备删除可传播。
 *
 * 简化设计（相对方案）：不维护 sync: 影子存储，composable 自有存储为 UI 唯一数据源，
 * 云端为备份/多设备同步层；远端增量通过 subscribe 监听器合并进 composable。
 */
import { getItem, setItem } from '@/utils/storage'
import { callCloud } from './cloud'

export interface SyncOp {
  action: 'write'
  collection: string
  data: Record<string, unknown> & { _id: string }
}

export interface RemoteDoc {
  key: string
  [field: string]: unknown
}

/** 远端增量监听器：composable 注册后将变更合并进本地状态 */
export type SyncListener = (collection: string, docs: RemoteDoc[]) => void

interface SyncResponse {
  serverTime: string
  remoteChanges: Record<string, RemoteDoc[]>
}

const QUEUE_KEY = 'math:sync-queue'
const LASTSYNC_KEY = 'math:sync-last-at'
const MAX_QUEUE = 200
const FLUSH_DELAY = 300

class DataSyncer {
  private queue: SyncOp[] = getItem<SyncOp[]>(QUEUE_KEY, [])
  private syncing = false
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<SyncListener>()
  lastSyncAt = getItem<string>(LASTSYNC_KEY, '1970-01-01T00:00:00.000Z')

  /** 写入（或墓碑删除）：本地队列 + 防抖同步 */
  write(collection: string, data: SyncOp['data']): void {
    this.enqueue({ action: 'write', collection, data })
  }

  /** 注册远端变更监听器，返回取消函数 */
  subscribe(fn: SyncListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  get pendingCount(): number {
    return this.queue.length
  }

  private enqueue(op: SyncOp): void {
    // 同集合同 _id 的旧操作被新操作覆盖（幂等压缩）
    this.queue = this.queue.filter(
      (o) => !(o.collection === op.collection && o.data._id === op.data._id)
    )
    this.queue.push(op)
    if (this.queue.length > MAX_QUEUE) this.queue.splice(0, this.queue.length - MAX_QUEUE)
    setItem(QUEUE_KEY, this.queue)
    this.scheduleFlush()
  }

  private scheduleFlush(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => void this.flush(), FLUSH_DELAY)
  }

  /** 批量 flush：调用 syncData 云函数，合并远端增量 */
  async flush(): Promise<void> {
    if (this.syncing || this.queue.length === 0) return
    this.syncing = true
    const ops = this.queue.splice(0)
    try {
      const res = await callCloud<SyncResponse>('syncData', {
        ops,
        lastSyncAt: this.lastSyncAt,
      })
      this.lastSyncAt = res.serverTime
      setItem(LASTSYNC_KEY, this.lastSyncAt)
      for (const [collection, docs] of Object.entries(res.remoteChanges ?? {})) {
        if (docs.length > 0) this.listeners.forEach((fn) => fn(collection, docs))
      }
      setItem(QUEUE_KEY, this.queue) // 持久化剩余队列（flush 期间可能有新入队）
    } catch (e) {
      // 失败重入队头，等待下次重试
      this.queue.unshift(...ops)
      if (this.queue.length > MAX_QUEUE) this.queue.splice(0, this.queue.length - MAX_QUEUE)
      setItem(QUEUE_KEY, this.queue)
    } finally {
      this.syncing = false
    }
  }
}

export const syncer = new DataSyncer()
