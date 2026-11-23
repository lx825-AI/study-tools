/**
 * sync-vectors.js —— 跨端合并语义共享测试向量（唯一来源）
 *
 * 由 js/__tests__/sync-codec.test.js 直接 import，保证 sync-codec 的合并
 * 语义逐字段被向量断言。**禁止随意改动**——改动前先确认 sync-codec.js
 * 的合并实现与向量同时演进。
 */

/** 词书 key 映射（web key ↔ mini key=canonical） */
export const WORDBOOK_KEY_PAIRS = [
  { web: 'senior-high-enriched', mini: 'senior-high-new' },
  { web: 'cet4-syllabus-enriched', mini: 'cet4-new' },
  { web: 'cet6-syllabus-enriched', mini: 'cet6-new' },
  { web: 'cet6-core-enriched', mini: 'cet6-core' },
  { web: 'kaoyan-enriched', mini: 'kaoyan-new' },
]

/** 日志条目工厂（date 字段由合并输出补全，向量内省略） */
const E = (cardsStudied, correct, wrong, duration = 300, completedGoal = true) => ({
  cardsStudied,
  correct,
  wrong,
  duration,
  completedGoal,
})

/** 卡片进度合并用例（cardMerge(a, b) -> expected） */
export const CARD_MERGE_CASES = [
  {
    name: 'stage 取较大侧且 nr 跟随高 stage 侧',
    a: {
      w: 'abandon', st: 3, nr: '2026-08-24',
      h: [{ stage: 2, date: '2026-08-23', passed: true, quality: 'correct' }],
      r: 3, e: 2.6, wc: 1, wd: ['2026-08-21'], ih: false,
    },
    b: {
      w: 'abandon', st: 1, nr: '2026-08-23',
      h: [{ stage: 1, date: '2026-08-22', passed: true, quality: 'fuzzy' }],
      r: 1, e: 2.5, wc: 0, wd: [], ih: false,
    },
    expected: {
      w: 'abandon', st: 3, nr: '2026-08-24', r: 3, e: 2.6, wc: 1, wd: ['2026-08-21'], ih: false,
      h: [
        { stage: 1, date: '2026-08-22', passed: true, quality: 'fuzzy' },
        { stage: 2, date: '2026-08-23', passed: true, quality: 'correct' },
      ],
    },
  },
  {
    name: '同 stage 取更早 nr（提前复习不丢词）',
    a: { w: 'banquet', st: 2, nr: '2026-09-01', h: [], r: 2, e: 2.5, wc: 0, wd: [], ih: false },
    b: { w: 'banquet', st: 2, nr: '2026-08-25', h: [], r: 2, e: 2.5, wc: 0, wd: [], ih: false },
    expected: { w: 'banquet', st: 2, nr: '2026-08-25', r: 2, e: 2.5, wc: 0, wd: [], ih: false, h: [] },
  },
  {
    name: '高 stage 侧 nr 为空时用另一侧补种（防脱离复习队列）',
    a: { w: 'cascade', st: 4, nr: '', h: [], r: 4, e: 2.8, wc: 0, wd: [], ih: false },
    b: { w: 'cascade', st: 1, nr: '2026-08-26', h: [], r: 1, e: 2.5, wc: 0, wd: [], ih: false },
    expected: { w: 'cascade', st: 4, nr: '2026-08-26', r: 4, e: 2.8, wc: 0, wd: [], ih: false, h: [] },
  },
  {
    name: 'history 同键去重保留非 correct 质量 + wrongDates 并集 + isHard OR',
    a: {
      w: 'delicate', st: 2, nr: '2026-08-30',
      h: [
        { stage: 1, date: '2026-08-20', passed: true, quality: 'correct' },
        { stage: 2, date: '2026-08-21', passed: true, quality: 'correct' },
      ],
      r: 2, e: 2.6, wc: 2, wd: ['2026-08-19', '2026-08-20'], ih: true,
    },
    b: {
      w: 'delicate', st: 2, nr: '2026-08-30',
      h: [
        { stage: 1, date: '2026-08-20', passed: true, quality: 'fuzzy' },
        { stage: 2, date: '2026-08-21', passed: true, quality: 'correct' },
      ],
      r: 2, e: 2.6, wc: 1, wd: ['2026-08-19'], ih: false,
    },
    expected: {
      w: 'delicate', st: 2, nr: '2026-08-30', r: 2, e: 2.6, wc: 2, wd: ['2026-08-19', '2026-08-20'], ih: true,
      h: [
        { stage: 1, date: '2026-08-20', passed: true, quality: 'fuzzy' },
        { stage: 2, date: '2026-08-21', passed: true, quality: 'correct' },
      ],
    },
  },
]

/**
 * 日志对端合并用例：logMerge(local, remote, state) -> { merged, state }
 * state = { snap, remotePrev }（接收端按发送端 deviceKind 分槽存储）
 * 公式：求和字段 = max(本地, 快照) + max(0, 远端 − 远端上次全量)
 */
export const LOG_MERGE_CASES = [
  {
    name: '首次同步：本地为空，直接采用远端',
    local: {}, remote: { '2026-08-22': E(10, 8, 2) },
    snap: {}, remotePrev: {},
    expected: { '2026-08-22': { date: '2026-08-22', ...E(10, 8, 2) } },
  },
  {
    name: '防重复累计：远端全量 +5、本地无新增 → 15 而非 20',
    local: { '2026-08-22': E(10, 8, 2) },
    remote: { '2026-08-22': E(15, 12, 3) },
    snap: { '2026-08-22': E(10, 8, 2) }, remotePrev: { '2026-08-22': E(10, 8, 2) },
    expected: { '2026-08-22': { date: '2026-08-22', ...E(15, 12, 3) } },
  },
  {
    name: '双方各自新增：本地 +3、远端 +10 → 23',
    local: { '2026-08-22': E(13, 10, 3) },
    remote: { '2026-08-22': E(20, 15, 5) },
    snap: { '2026-08-22': E(10, 8, 2) }, remotePrev: { '2026-08-22': E(10, 8, 2) },
    expected: { '2026-08-22': { date: '2026-08-22', ...E(23, 17, 6) } },
  },
  {
    name: '重复导入同一文件：不动点',
    local: { '2026-08-22': E(23, 17, 6) },
    remote: { '2026-08-22': E(20, 15, 5) },
    snap: { '2026-08-22': E(23, 17, 6) }, remotePrev: { '2026-08-22': E(20, 15, 5) },
    expected: { '2026-08-22': { date: '2026-08-22', ...E(23, 17, 6) } },
  },
  {
    name: '多轮文件同步：远端再次导出（新增 d3、d2 +3）',
    local: { '2026-08-22': E(12, 10, 2) },
    remote: { '2026-08-22': E(10, 8, 2), '2026-08-23': E(4, 4, 0, 90, true) },
    snap: { '2026-08-22': E(12, 10, 2) }, remotePrev: { '2026-08-22': E(7, 6, 1) },
    expected: {
      '2026-08-22': { date: '2026-08-22', ...E(15, 12, 3) },
      '2026-08-23': { date: '2026-08-23', ...E(4, 4, 0, 90, true) },
    },
  },
  {
    name: '发送端同日覆盖回退：快照守卫不丢历史量',
    local: { '2026-08-22': E(20, 15, 5) },
    remote: { '2026-08-22': E(13, 10, 3) },
    snap: { '2026-08-22': E(20, 15, 5) }, remotePrev: { '2026-08-22': E(20, 15, 5) },
    expected: { '2026-08-22': { date: '2026-08-22', ...E(20, 15, 5) } },
  },
  {
    name: 'duration 取大 + completedGoal OR + 日期并集',
    local: {
      '2026-08-21': E(5, 4, 1, 100, false),
      '2026-08-22': E(10, 8, 2, 200, true),
    },
    remote: {
      '2026-08-22': E(10, 8, 2, 150, false),
      '2026-08-23': E(3, 3, 0, 90, true),
    },
    snap: {}, remotePrev: {},
    expected: {
      '2026-08-21': { date: '2026-08-21', ...E(5, 4, 1, 100, false) },
      '2026-08-22': { date: '2026-08-22', cardsStudied: 20, correct: 16, wrong: 4, duration: 200, completedGoal: true },
      '2026-08-23': { date: '2026-08-23', ...E(3, 3, 0, 90, true) },
    },
  },
]

/** 发起端回程应用用例 applyLogResult(current, sent, received) */
export const LOG_RESULT_CASES = [
  {
    name: '等待窗口内新学习被吸收：收到 20，本端已从 10 学到 15 → 25',
    current: { '2026-08-22': E(15, 12, 3) },
    sent: { '2026-08-22': E(10, 8, 2) },
    received: { '2026-08-22': { date: '2026-08-22', ...E(20, 15, 5) } },
    expected: { '2026-08-22': { date: '2026-08-22', ...E(25, 19, 6) } },
  },
  {
    name: '无窗口学习：直接采纳合并结果',
    current: { '2026-08-22': E(10, 8, 2) },
    sent: { '2026-08-22': E(10, 8, 2) },
    received: { '2026-08-22': { date: '2026-08-22', ...E(20, 15, 5) } },
    expected: { '2026-08-22': { date: '2026-08-22', ...E(20, 15, 5) } },
  },
]

/** 设置合并用例（远端有合法值即采用 = 以导出端为准） */
export const SETTINGS_MERGE_CASES = [
  {
    name: '远端有值则采用',
    local: { dailyGoal: 20, accent: 'us', theme: 'light' },
    remote: { dailyGoal: 40, accent: 'uk', theme: 'dark' },
    expected: { dailyGoal: 40, accent: 'uk', theme: 'dark' },
  },
  {
    name: '远端缺字段保留本地',
    local: { dailyGoal: 20, accent: 'us', theme: 'dark' },
    remote: { dailyGoal: 40 },
    expected: { dailyGoal: 40, accent: 'us', theme: 'dark' },
  },
  {
    name: '非法值夹紧/回退本地',
    local: { dailyGoal: 20, accent: 'us', theme: 'light' },
    remote: { dailyGoal: 9999, accent: 'xx', theme: 'blue' },
    expected: { dailyGoal: 100, accent: 'us', theme: 'light' },
  },
]

/** FNV-1a 32-bit 已知向量 */
export const FNV1A_CASES = [
  { input: '', expected: '811c9dc5' },
  { input: 'a', expected: 'e40c292c' },
  { input: 'foobar', expected: 'bf9cf968' },
]

/** 配对码（迁移码）校验向量：两端 codec + 云函数 lib 三方一致 */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export const VALID_CODE_CASES = [
  { input: '23456789', valid: true },
  { input: 'ABCDEFGH', valid: true },
  { input: 'KMNPQRST', valid: true },
  { input: '0O1IL234', valid: false }, // 含剔除字符
  { input: 'abcdefgh', valid: false }, // 小写
  { input: 'ABCDEFG', valid: false }, // 7 位
  { input: 'ABCDEFGHI', valid: false }, // 9 位
  { input: 'ABCDEFG!', valid: false }, // 非法字符
  { input: '', valid: false },
  { input: '23456789', valid: true }, // 全数字合法（字符集含 2-9，不含 1）
]
