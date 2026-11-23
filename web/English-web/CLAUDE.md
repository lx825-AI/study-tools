# English Flashcard PWA

SPA 英语词汇闪卡应用，艾宾浩斯遗忘曲线单轨调度（v2.8 起删除 SM-2）。纯 JavaScript，零运行时依赖，产物同时用于网页、Windows 桌面端与 Android App。

## 项目结构

```
index.html          -- SPA 入口（5 个 tab：牌组/学习/预览/卡片/统计）
js/
  app.js            -- init()、语音朗读、词书全量预加载、待复习 toast、PWA 安装横幅、离线提示
  state.js          -- 全局状态、getDeck/getCurrentDeck
  idb-storage.js    -- IndexedDB 主存储 + localStorage 降级备份（突破 5MB 限制，精简压缩）
  models.js         -- ID 生成、难度计算、词规范化
  day-key.js        -- 本地日历日工具（见下方「日期口径」）
  utils.js          -- HTML 转义、CSV 解析、拼写纯函数（parseWordSlots/lettersOnly/rebuildSlotLetters/firstEmptySlotIndex）、卡片分类（cardStageCategory/filterCardsByStage）、getDailyGoal
  ebbinghaus.js     -- 艾宾浩斯调度：8 阶段复习、到期检测、紧急度排序、深度模式重插位置
  ui.js             -- 牌组选择渲染、面板切换、导航徽章、renderAll
  daily-quote.js    -- 每日英语名言（34 条）、pickTodayQuote/getNextQuote/switchQuote
  deck-panel.js     -- 牌组管理（编辑/删除；牌组仅由内置词书导入产生）
  quick-mode.js     -- 快速浏览模式（startQuickMode/applyQuickResult/loadQuickLog）
  study-panel.js    -- 多模式学习 + 拼写模式 + 艾宾浩斯作答 + 进度持久化
  wrong-words.js    -- 错词列表：学习模式引导页「错题强化」折叠区、单卡移出
  preview-panel.js  -- 表格预览（200+ 卡片虚拟滚动）
  cards-panel.js    -- 卡片列表（虚拟滚动）、阶段筛选、批量删除
  import.js         -- 内置词书注册表（20 本）、script 动态加载、词书来源声明、两级分类弹窗
  stats-panel.js    -- 统计面板编排（KPI/周报/打卡日历/热力图/遗忘曲线/阶段分布/错题）
  stats-aggregate.js-- 统计纯聚合函数
  stats-curve.js    -- 遗忘曲线 Canvas 绘制
  sync-codec.js     -- 跨端数据纯函数核心（规范 schema/词书 key 映射/卡片与日志合并/分块协议）
  sync-ui.js        -- 同步弹窗 UI（JSON 文件导出/导入）
data/
  word-schema.js    -- 扩展词格式校验、definitions 数组保证、旧数据迁移
css/                -- 9 个 CSS 文件（variables/base/components/deck/study/mode/preview/stats/stats-charts）
wordbooks/          -- 20 套词书 JS（注册到 window.__VOCAB_REGISTRY__，由 gen-wordbooks.js 生成）
wordbooks-src/      -- 词书源数据 JSON（20 个，约 24MB，不入构建产物）
scripts/
  build.js          -- esbuild 构建（CSS 合并、JS 打包、词书复制、HTML 组装）
  gen-wordbooks.js  -- wordbooks-src/ JSON → 紧凑单行 JS（npm run gen:wordbooks）
  wordbook-lib.js   -- 词书生成纯函数库（BOOK_CONFIG/compactWords/buildRegistrySource）
```

## 学习模式

- **📖 学习新词（深度模式）**：动态队列——每轮新词数跟随每日目标（默认 10，引导页可设 5-200）；答完 splice 移除后按阶段重插（答错 idx+3；答对 stage≤1→idx+5、stage2→idx+10、stage3→idx+15），出现≥3 次或阶段≥4 永久移出；计数点 ●●○；「← 上一个」回看（回看态会了/不会置灰）
- **🔁 今日复习**：到期词按紧急度综合评分排序（逾期 10/20/35/50 + 阶段 5/10/15 + EF 5/10/15 + wrongCount 0/5/10），软上限 50
- **📋 错题强化**：集中攻克所有牌组中 EF≤1.8 且已学过的难词
- **⚡ 快速浏览**：队列仅 stage<5（新词→到期→逾期降序→阶段升序，截断到每日目标）；答对仅 stage 0→1（EF+0.1、reps+1、写一条历史），答错 wrongCount++/wrongDates/_consecutiveFails++
- **⌨️ 拼写模式（纯练习）**：下划线展示位 + 单隐藏输入框（键盘只弹一次；隐藏框 native 值为真值源全量重建，退格天然撤回）；词间分组、连字符/撇号固定展示、判定两侧剥除非字母（"don't" 填 dont 判对）；对/错均停留当前词——正确 ✅+音标+朗读、字母保留绿色下划线（改字母回输入态）；错误 ❌ 错位红显 + 答案行完整揭示，2000ms 后自动清空盲拼重试；**不推进队列、不改遗忘曲线、不写学习日志**
- **🔊 发音**：换卡 300ms 后自动朗读（仅学习面板可见时）；有道音频失败 600ms 重试一次，`_audioPlaySeq` 防旧重试打断；英/美音切换写全局偏好

## 学习算法（单轨）

- **SM-2 已删除**：EF/repetitions 统一由 `applyEbbinghaus(card, passed, quality)` 维护；调度日期仅 `ebbinghausNextReview`（旧 nextReview/interval/difficulty 字段冻结保留，不再写入）
- 答对：stage++、EF+0.1（封顶 3.5）、reps+1、间隔自适应 `round(interval×EF/2.5)` 下限 1、逾期>7 天且 prevStage>1 降 1 级门控、history 带 quality
- 答错：智能回退（stage≤2 或连败≥2 → 1，否则退 1 级）+ 逾期惩罚（1-3 天 0 / 4-7 天 1 / >7 天 2）取 min 不叠加、EF−0.2（下限 1.3）、reps=0、_consecutiveFails++
- 会话恢复 TTL 2 小时；快照存累计 elapsed 秒，恢复时重锚 startTime（不计关闭空闲）
- 统计落库：会话完成时按卡去重汇总（当日覆盖语义），日志 `{date, cardsStudied, correct, wrong, duration, completedGoal}`；已掌握口径 = ebbinghausStage≥7

## 词书系统

20 套词书：10 乱序 + 10 正序（`-sorted`，与乱序两两同词仅排序不同），由 `gen-wordbooks.js` 读取 `wordbooks-src/` 的 20 个 JSON 生成（约 17MB，入库）。

**三处清单必须同步维护**：`scripts/wordbook-lib.js` 的 `BOOK_CONFIG`、`js/import.js` 的 `BUILTIN_WORDBOOKS`、`scripts/build.js` 的 `WORDBOOKS`。

导入面板第二屏为大类/核心双节，每节渲染 🔀乱序版 / 🔤正序版 书行（`order` 字段 + 静态词数）；进入第二屏即后台预取该级别全部词书脚本。已导入判定按 `deck.source`（词书 key）优先，旧牌组按 name 回退。学习队列：新词=词书原序（动态重插）、复习=紧急度降序、快速=新词/到期/逾期优先级、错题=EF 升序。

## 跨端同步（文件通道）

- `js/sync-codec.js`：规范 schema v1、词书 key 映射、卡片按 `(deck.source, lower(word))` 锚定取较优（stage/nextReview/history 并集截断 100/wrongDates 并集/isHard OR）、日志合并 `M = max(本地, 快照) + max(0, 远端 − 远端上次全量)`、设置以导出端为准（en-US/en-GB ↔ us/uk 归一）、`chunkPayload`/`assembleChunks` 64KB + FNV-1a 分块
- `js/sync-ui.js`：头部 🔄 弹窗，JSON 文件导出/导入（未导入词书整包跳过并计入摘要）
- 合并状态存 `flashcard-sync-log-state`，按发送端 `deviceKind` 分槽 `{web|mini: {snap, remotePrev}}`——`mini` 槽位保留，用于兼容旧导出文件
- 共享测试向量：`js/__tests__/data/sync-vectors.js`（唯一来源，禁止随意改动）

## 卡片数据结构

```json
{
  "id": "...",
  "front": "abandon",
  "back": "丢弃；放弃",
  "easeFactor": 2.5,
  "repetitions": 0,
  "interval": 0,
  "nextReview": "2026-06-01",
  "ebbinghausStage": 0,
  "ebbinghausNextReview": "2026-06-01",
  "ebbinghausHistory": []
}
```

- `ebbinghausStage` 0-7：0=新词，1-6=复习阶段，7=已掌握（90 天后仍会到期再进复习队列）
- `ebbinghausHistory`：`[{stage, date, passed}]`
- 兼容旧数据：`initEbbinghaus()` 自动迁移，无艾宾浩斯字段的卡片从旧字段推断初始阶段

## 艾宾浩斯阶段

| 阶段 | 间隔 |
|------|------|
| 0 | 新学 |
| 1 | 1 天 |
| 2 | 2 天 |
| 3 | 4 天 |
| 4 | 7 天 |
| 5 | 15 天 |
| 6 | 30 天 |
| 7 | 90 天（已掌握） |

## 学习进度持久化

- `sessionStorage` 保存当前学习队列（模式、队列、索引、成绩、elapsed）
- `beforeunload` / `visibilitychange` 触发保存；`renderStudyPanel` 时检查并恢复（2 小时过期，与牌组 id 交叉校验）
- 切离学习 tab 时弃置当前会话（写一条 `completedGoal=false` 的早退日志），切回重新选择模式

## 构建

```bash
npm run build          # esbuild 构建到 dist/
npm run dev            # npx serve dist/ 本地预览
npm run gen:wordbooks  # 重新生成 wordbooks/*.js
npm test               # vitest（20 文件 343 用例）
```

- `scripts/build.js` **不清空 dist**：删过文件后需 `rm -rf dist` 再构建，否则残留旧模块。
- 改动前端资源后同步升 `sw.js` 的缓存版本（当前 `v19`），否则已装 PWA 拿不到更新。
- 产物资源全部用相对路径（`./app.bundle.js` 等），可直接被 Electron / Capacitor 加载。

## 关键状态 key

- `flashcard-data` — 牌组 + 卡片 + 艾宾浩斯状态
- `flashcard-learning-log` — 深度模式每日学习记录
- `flashcard-quick-log` — 快速模式独立每日记录
- `flashcard-daily-goal` — 每日目标词数
- `flashcard-sync-log-state` — 同步日志合并状态（按发送端分槽）
- `flashcard-study-progress` — 学习进度（sessionStorage）
- `flashcard-theme` — 主题偏好
- `flashcard-tts-accent` — 发音口音偏好
- `flashcard-quote-date` / `flashcard-quote-index` — 每日一句

## 已知限制

- **file:// 协议 Service Worker 同步抛异常**：Chrome 下 `navigator.serviceWorker.register()` 在 file:// 会同步抛 TypeError，`.catch()` 抓不到——外层必须 try/catch（index.html 与 scripts/build.js 同步处理）
- **`build.js` 移除内联 `<style>`**：依赖 CSS 文件里已有同名样式；新增内联样式必须先同步进对应 CSS
- **日期口径统一走 `js/day-key.js`**：所有「今天 / 到期 / 日志 key / 打卡 / 热力图」都用本地日历日（`App.dayKey()` / `App.addDays()` / `App.daysBetween()` / `App.weekStartKey()`）。v1.1.0 之前用 `new Date().toISOString().slice(0, 10)` 取 UTC 日期，UTC+8 的凌晨 00:00-08:00 会记到前一天；不要再引入这种写法。测试时区由 `vitest.config.js` 固定为 Asia/Shanghai。
