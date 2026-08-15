/**
 * DataSyncer 同步引擎测试：mock wx.cloud 验证 flush / 重试 / 增量合并
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { uniMock } from './setup'

const mockCallFunction = vi.fn()

beforeEach(() => {
  uniMock.__clear()
  mockCallFunction.mockReset()
  vi.stubGlobal('wx', { cloud: { callFunction: mockCallFunction } })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('uni', uniMock) // unstubAll 会连带移除 uni，需重新挂上
})

async function freshSyncer() {
  vi.resetModules()
  const m = await import('@/services/sync')
  return m.syncer
}

describe('DataSyncer', () => {
  it('write 入队并压缩同 _id 重复操作', async () => {
    const syncer = await freshSyncer()
    syncer.write('favorites', { _id: 'k1', sectionId: 'calc-limit', formulaIndex: 0 })
    syncer.write('favorites', { _id: 'k1', sectionId: 'calc-limit', formulaIndex: 0, deleted: true })
    syncer.write('favorites', { _id: 'k2', sectionId: 'calc-limit', formulaIndex: 1 })
    expect(syncer.pendingCount).toBe(2)
  })

  it('flush 成功：清空队列、更新 lastSyncAt、分发远端增量', async () => {
    mockCallFunction.mockResolvedValue({
      result: {
        serverTime: '2026-07-22T00:00:00.000Z',
        remoteChanges: {
          notes: [{ key: 'university_calc-limit_0', sectionId: 'calc-limit', formulaIndex: 0, content: '远端笔记' }],
        },
      },
    })
    const syncer = await freshSyncer()
    const received: [string, unknown[]][] = []
    syncer.subscribe((c, docs) => received.push([c, docs]))
    syncer.write('favorites', { _id: 'k1', sectionId: 'calc-limit', formulaIndex: 0 })
    await syncer.flush()

    expect(mockCallFunction).toHaveBeenCalledTimes(1)
    const call = mockCallFunction.mock.calls[0][0]
    expect(call.name).toBe('syncData')
    expect(call.data.ops.length).toBe(1)
    expect(syncer.pendingCount).toBe(0)
    expect(syncer.lastSyncAt).toBe('2026-07-22T00:00:00.000Z')
    expect(received).toEqual([
      ['notes', [{ key: 'university_calc-limit_0', sectionId: 'calc-limit', formulaIndex: 0, content: '远端笔记' }]],
    ])
  })

  it('flush 失败：操作重入队，不丢失', async () => {
    mockCallFunction.mockRejectedValue(new Error('网络不可用'))
    const syncer = await freshSyncer()
    syncer.write('favorites', { _id: 'k1', sectionId: 'calc-limit', formulaIndex: 0 })
    await syncer.flush()
    expect(syncer.pendingCount).toBe(1)

    // 恢复网络后可成功重试
    mockCallFunction.mockResolvedValue({ result: { serverTime: '2026-07-22T01:00:00.000Z', remoteChanges: {} } })
    await syncer.flush()
    expect(syncer.pendingCount).toBe(0)
  })

  it('队列持久化到本地存储（重启不丢）', async () => {
    const syncer = await freshSyncer()
    syncer.write('favorites', { _id: 'k1', sectionId: 'calc-limit', formulaIndex: 0 })
    const raw = uniMock.getStorageSync('math:sync-queue')
    expect(raw).toBeTruthy()
    const queue = JSON.parse(raw)
    expect(queue.length).toBe(1)
    expect(queue[0].data._id).toBe('k1')
  })

  it('空队列 flush 不发起请求', async () => {
    const syncer = await freshSyncer()
    await syncer.flush()
    expect(mockCallFunction).not.toHaveBeenCalled()
  })
})
