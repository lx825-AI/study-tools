/**
 * sync-codec.test.js —— 跨端数据联通 codec/合并纯函数 + Web 端收集/应用
 * 共享向量引用 English-mini-app/tests/data/sync-vectors.js（单一来源；
 * 子模块缺失时优雅跳过向量用例，本地结构用例仍全量执行）
 */
import { describe, it, expect, beforeEach } from 'vitest'

let V = null
try {
  V = await import('../../../English-mini-app/tests/data/sync-vectors.js')
} catch (e) {
  V = null
}
const describeV = V ? describe : describe.skip

const App = window.FlashcardApp
const SC = App.SyncCodec

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function entry(cardsStudied, correct, wrong, duration = 300, completedGoal = true) {
  return { date: today, cardsStudied, correct, wrong, duration, completedGoal }
}

function miniPayload() {
  return {
    schemaVersion: SC.SCHEMA_VERSION,
    appName: SC.APP_NAME,
    deviceKind: 'mini',
    exportTime: new Date().toISOString(),
    data: {
      settings: { dailyGoal: 50, accent: 'uk', theme: 'dark' },
      decks: [
        {
          source: 'cet4-new',
          name: '四级大纲词汇（乱序）',
          cards: [
            { w: 'abandon', st: 3, nr: tomorrow, h: [], r: 3, e: 2.7, wc: 1, wd: ['2026-08-20'], ih: false },
            { w: 'nonexistent', st: 1, nr: '', h: [], r: 1, e: 2.5, wc: 0, wd: [], ih: false },
          ],
        },
      ],
      logs: { deep: { [today]: entry(8, 7, 1, 60, true) }, quick: {} },
    },
  }
}

function seedWeb() {
  localStorage.clear()
  App.state = {
    decks: [
      {
        id: 'd1',
        name: '四级大纲词汇（乱序）',
        source: 'cet4-syllabus-enriched',
        cards: [
          {
            id: 'c1', word: 'abandon', front: 'abandon', back: '丢弃',
            ebbinghausStage: 1, ebbinghausNextReview: today, ebbinghausHistory: [],
            repetitions: 1, easeFactor: 2.5, wrongCount: 0, wrongDates: [], isHard: false,
          },
          {
            id: 'c2', word: 'banquet', front: 'banquet', back: '宴会',
            ebbinghausStage: 0, ebbinghausNextReview: '', ebbinghausHistory: [],
            repetitions: 0, easeFactor: 2.5, wrongCount: 0, wrongDates: [], isHard: false,
          },
        ],
      },
      { id: 'd2', name: '自定义', source: null, cards: [] },
    ],
    currentDeckId: null,
  }
  localStorage.setItem('flashcard-learning-log', JSON.stringify({ [today]: entry(5, 4, 1, 100, false) }))
  localStorage.setItem('flashcard-quick-log', JSON.stringify({}))
  localStorage.setItem('flashcard-daily-goal', '20')
  localStorage.setItem('flashcard-theme', 'light')
  localStorage.setItem('flashcard-tts-accent', 'en-US')
}

beforeEach(() => {
  localStorage.clear()
  App.state = { decks: [], currentDeckId: null }
})

describe('fnv1a', () => {
  it('已知向量', () => {
    expect(SC.fnv1a('')).toBe('811c9dc5')
    expect(SC.fnv1a('a')).toBe('e40c292c')
    expect(SC.fnv1a('foobar')).toBe('bf9cf968')
  })
})

describe('词书 key 映射', () => {
  it('覆盖本端 BUILTIN_WORDBOOKS 全部 20 本 key（防漂移）', () => {
    expect(App.BUILTIN_WORDBOOKS).toHaveLength(20)
    App.BUILTIN_WORDBOOKS.forEach((b) => {
      expect(SC.canonicalizeKey(b.key, 'web')).not.toBeNull()
    })
  })

  it('未知/空 key 拒绝传输', () => {
    expect(SC.canonicalizeKey('custom', 'web')).toBeNull()
    expect(SC.canonicalizeKey('', 'web')).toBeNull()
    expect(SC.canonicalizeKey(null, 'web')).toBeNull()
  })

  describeV('与小程序共享映射向量', () => {
    it('5 组固定映射断言', () => {
      V.WORDBOOK_KEY_PAIRS.forEach((p) => {
        expect(SC.canonicalizeKey(p.web, 'web')).toBe(p.mini)
        expect(SC.canonicalizeKey(p.mini, 'mini')).toBe(p.mini)
      })
    })
  })
})

describeV('cardMerge（共享向量）', () => {
  V.CARD_MERGE_CASES.forEach((c) => {
    it(c.name, () => {
      expect(SC.cardMerge(c.a, c.b)).toEqual(c.expected)
    })
  })

  it('幂等 + 交换律', () => {
    const c = V.CARD_MERGE_CASES[0]
    expect(SC.cardMerge(SC.cardMerge(c.a, c.b), c.b)).toEqual(c.expected)
    expect(SC.cardMerge(c.b, c.a)).toEqual(c.expected)
  })
})

describe('mergeDeckCards', () => {
  it('按 word 锚定合并 + 缺失词条跳过计数', () => {
    const local = [
      { id: 'c1', word: 'abandon', front: 'abandon', back: '丢弃', ebbinghausStage: 1, ebbinghausNextReview: '', ebbinghausHistory: [], repetitions: 1, easeFactor: 2.5, wrongCount: 0, wrongDates: [], isHard: false },
    ]
    const remote = [
      { w: 'abandon', st: 3, nr: '2026-09-01', h: [], r: 3, e: 2.7, wc: 1, wd: ['2026-08-20'], ih: true },
      { w: 'missing', st: 1, nr: '', h: [], r: 1, e: 2.5, wc: 0, wd: [], ih: false },
    ]
    const res = SC.mergeDeckCards(local, remote)
    expect(res.mergedCount).toBe(1)
    expect(res.skippedCount).toBe(1)
    expect(res.cards[0].ebbinghausStage).toBe(3)
    expect(res.cards[0].wrongDates).toEqual(['2026-08-20'])
    expect(res.cards[0].isHard).toBe(true)
  })
})

describeV('logMerge（共享向量）', () => {
  V.LOG_MERGE_CASES.forEach((c) => {
    it(c.name, () => {
      const res = SC.logMerge(c.local, c.remote, { snap: c.snap, remotePrev: c.remotePrev })
      expect(res.merged).toEqual(c.expected)
      expect(res.state.snap).toEqual(c.expected)
      expect(res.state.remotePrev).toEqual(c.remote)
    })
  })

  it('applyLogResult（共享向量）', () => {
    V.LOG_RESULT_CASES.forEach((c) => {
      expect(SC.applyLogResult(c.current, c.sent, c.received)).toEqual(c.expected)
    })
  })
})

describeV('settingsMerge（共享向量）', () => {
  V.SETTINGS_MERGE_CASES.forEach((c) => {
    it(c.name, () => {
      expect(SC.settingsMerge(c.local, c.remote)).toEqual(c.expected)
    })
  })
})

describe('codec 往返与校验', () => {
  it('encode → decode 恒等', () => {
    const payload = {
      schemaVersion: SC.SCHEMA_VERSION,
      appName: SC.APP_NAME,
      deviceKind: 'web',
      exportTime: '2026-08-23T00:00:00.000Z',
      data: { settings: {}, decks: [], logs: { deep: {}, quick: {} } },
    }
    expect(SC.decodePayload(SC.encodePayload(payload))).toEqual(payload)
  })

  it('拒绝：非法 JSON / appName 不符 / 版本过新 / 缺版本信息', () => {
    expect(() => SC.decodePayload('not json')).toThrow('数据解析失败')
    expect(() => SC.decodePayload('{"appName":"other"}')).toThrow('非本应用')
    expect(() => SC.decodePayload('{"appName":"english-app","schemaVersion":99}')).toThrow('版本过新')
    expect(() => SC.decodePayload('{"appName":"english-app"}')).toThrow('版本信息')
  })

  it('旧版 data-io 格式自动转换', () => {
    const legacy = {
      version: 1,
      appName: 'english-app',
      data: {
        user: { settings: { dailyGoal: 20, accent: 'us' } },
        decks: [{ _id: 'deck_x', name: '四级大纲词汇（乱序）', source: 'cet4-new' }],
        learningLogs: {},
        cards: { deck_x: [{ word: 'abandon', front: 'abandon', ebbinghausStage: 2, ebbinghausNextReview: '2026-08-21' }] },
      },
    }
    const out = SC.decodePayload(JSON.stringify(legacy))
    expect(out.schemaVersion).toBe(SC.SCHEMA_VERSION)
    expect(out.data.decks[0].source).toBe('cet4-new')
    expect(out.data.decks[0].cards[0]).toMatchObject({ w: 'abandon', st: 2 })
  })
})

describe('分块协议', () => {
  it('小 payload 单块往返', () => {
    const payload = { hello: 'world' }
    const { chunks, checksum } = SC.chunkPayload(payload)
    expect(chunks).toHaveLength(1)
    expect(SC.assembleChunks(chunks, chunks[0].total, checksum)).toEqual(payload)
  })

  it('大 payload 多块往返（含代理对安全切分）', () => {
    const payload = { text: '😀'.repeat(300) + '词'.repeat(300), n: 42 }
    const { chunks, checksum } = SC.chunkPayload(payload, 64)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach((c) => expect(c.total).toBe(chunks.length))
    expect(SC.assembleChunks(chunks, chunks.length, checksum)).toEqual(payload)
  })

  it('缺块/篡改/总数不符 → CHUNK_MISMATCH', () => {
    const payload = { text: 'a'.repeat(500) }
    const { chunks, checksum } = SC.chunkPayload(payload, 100)
    expect(() => SC.assembleChunks(chunks.slice(1), chunks.length, checksum)).toThrow('CHUNK_MISMATCH')
    const tampered = chunks.map((c) => (c.chunkIndex === 0 ? { ...c, data: c.data + 'x' } : c))
    expect(() => SC.assembleChunks(tampered, chunks.length, checksum)).toThrow('CHUNK_MISMATCH')
    expect(() => SC.assembleChunks(chunks, chunks.length + 1, checksum)).toThrow('CHUNK_MISMATCH')
  })
})

describe('Web 端收集/应用（collectPayload / mergeIntoLocal）', () => {
  it('collectPayload：规范化 source + 进度精简 + 手工牌组跳过', () => {
    seedWeb()
    const payload = SC.collectPayload()
    expect(payload.deviceKind).toBe('web')
    expect(payload.data.decks).toHaveLength(1)
    expect(payload.data.decks[0].source).toBe('cet4-new')
    expect(payload.data.decks[0].cards).toHaveLength(2)
    expect(payload.data.decks[0].cards[0]).toMatchObject({ w: 'abandon', st: 1 })
    expect(payload.data.logs.deep[today].cardsStudied).toBe(5)
    expect(payload.data.settings).toEqual({ dailyGoal: 20, accent: 'us', theme: 'light' })
  })

  it('mergeIntoLocal：卡片/日志/设置合并 + 快照状态 + 重复导入不动点', () => {
    seedWeb()
    const summary = SC.mergeIntoLocal(miniPayload())
    expect(summary).toEqual({ decksMerged: 1, cardsMerged: 1, cardsSkipped: 1, decksSkipped: [] })

    /* 卡片：stage 1 → 3（web source 映射回 cete4-syllabus-enriched 匹配成功） */
    const deck = App.state.decks.find((d) => d.source === 'cet4-syllabus-enriched')
    expect(deck.cards[0].ebbinghausStage).toBe(3)
    expect(deck.cards[0].ebbinghausNextReview).toBe(tomorrow)

    /* 日志：本地 5 + 远端 8 = 13；设置以导出端为准 */
    expect(JSON.parse(localStorage.getItem('flashcard-learning-log'))[today].cardsStudied).toBe(13)
    expect(localStorage.getItem('flashcard-daily-goal')).toBe('50')
    expect(localStorage.getItem('flashcard-tts-accent')).toBe('en-GB')
    expect(localStorage.getItem('flashcard-theme')).toBe('dark')
    expect(App.ttsAccent).toBe('en-GB')

    /* 状态槽：mini 发送端 */
    const state = JSON.parse(localStorage.getItem('flashcard-sync-log-state'))
    expect(state.mini.snap.deep[today].cardsStudied).toBe(13)
    expect(state.mini.remotePrev.deep[today].cardsStudied).toBe(8)

    /* 重复导入同一 payload：日志不动点 */
    SC.mergeIntoLocal(miniPayload())
    expect(JSON.parse(localStorage.getItem('flashcard-learning-log'))[today].cardsStudied).toBe(13)
  })

  it('mergeIntoLocal：未导入词书跳过 + 手工牌组不匹配', () => {
    seedWeb()
    const payload = miniPayload()
    payload.data.decks[0].source = 'kaoyan-new'
    const summary = SC.mergeIntoLocal(payload)
    expect(summary.decksSkipped).toHaveLength(1)
    expect(summary.cardsMerged).toBe(0)
  })
})
