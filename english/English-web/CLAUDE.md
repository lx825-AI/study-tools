# English Flashcard PWA

SPA 英语词汇闪卡应用，使用 SM-2 间隔重复 + 艾宾浩斯遗忘曲线算法。纯 JavaScript，零运行时依赖。功能与微信小程序版（English-mini-app）对齐。

## 学习模式

- **📖 学习新词**：从未学过的单词开始第一轮学习
- **🔁 今日复习**：按艾宾浩斯遗忘曲线复习今日到期的单词
- **📋 错题强化**：集中攻克所有牌组中 EF≤1.8 且已学过的难词
- **⚡ 快速浏览**：线性过词快速刷词（对齐小程序语义——答对仅 stage 0→1 + 明天复习，不写 ebbinghausHistory，独立日志 `flashcard-quick-log`，不污染深度复习）
- **⌨️ 拼写验证**：学习中内嵌拼写模式，看释义输入英文，自动判断正误

## 项目结构

```
index.html          -- SPA 入口（6 个 tab：牌组/学习/预览/卡片/统计/错词本）
js/
  app.js            -- init()、语音朗读、词书全量预加载、待复习 toast、PWA 安装横幅、离线提示
  state.js          -- 全局状态、getDeck/getCurrentDeck
  idb-storage.js    -- IndexedDB 主存储 + localStorage 降级备份（突破5MB限制，数据精简压缩）
  models.js         -- ID 生成、难度计算、词规范化
  utils.js          -- HTML 转义、CSV 解析、Levenshtein 模糊搜索、getCardFront/getCardBack 安全取值
  ebbinghaus.js     -- 艾宾浩斯遗忘曲线：8阶段复习调度、到期检测、逾期排序
  ui.js             -- 牌组选择渲染、面板切换（panelMap 含 wrong）、导航徽章、renderAll
  daily-quote.js    -- 每日英语名言（37 条，与小程序同源）、pickTodayQuote/renderDailyQuote
  deck-panel.js     -- 牌组 CRUD（学习/编辑/删除）
  quick-mode.js     -- 快速浏览模式（startQuickMode/applyQuickResult/trackQuick/loadQuickLog）
  study-panel.js    -- 多模式学习 + 拼写模式（⌨️ 内嵌）+ SM-2/艾宾浩斯作答 + 进度持久化
  wrong-words.js    -- 错词本面板（collectFailedCards 复用、批量练习、EF 重置移出）
  preview-panel.js  -- 表格预览（200+ 卡片虚拟滚动）、搜索、高亮
  cards-panel.js    -- 卡片列表（100+ 虚拟滚动）、批量选择与删除
  import.js         -- 内置词书注册表（10 本）、script 动态加载、词书来源声明、导入弹窗两级分类（级别×大纲/核心，对齐小程序）
  stats-panel.js    -- 学习日志、连续打卡、周统计、热力图、艾宾浩斯分布、每日目标、分享入口
data/
  word-schema.js    -- 扩展词格式校验与规范化、_ensureDefinitionsArray 数组保证、migrateCardsSchema 数据迁移
css/                -- 10 个 CSS 文件
  variables.css / base.css / components.css / deck.css
  study.css / mode.css / typing.css / preview.css / stats.css
wordbooks/          -- 10 套词书（JS 格式，注册到 window.__VOCAB_REGISTRY__，由 gen-wordbooks.js 生成）
scripts/
  build.js           -- esbuild 构建（CSS 合并、JS 打包、词书复制、HTML 组装）
  gen-wordbooks.js   -- 词书生成：读 English-mini-app/wordbooks-cloud/ 10 套 JSON → 紧凑 JS（npm run gen:wordbooks）
  wordbook-lib.js    -- 词书生成纯函数库（BOOK_CONFIG/compactWords/buildRegistrySource，供脚本与测试复用）
```

## 词书系统

10 套词书与小程序（English-mini-app）同源：`scripts/gen-wordbooks.js` 读取 `English-mini-app/wordbooks-cloud/` 的 10 个乱序 JSON（与小程序默认导入一致）生成紧凑单行 JS（约 8MB）。前 5 本替换旧词书（沿用旧 key/旧 name，已导入用户按 name 去重），后 5 本为新增。学习队列固定按 EF 升序排列（难的在前）。SW 仅预缓存 2 本最常用（高中+四级），其余按需 runtime cache。BOOK_CONFIG 与 import.js 的 BUILTIN_WORDBOOKS 需同步维护。

## 最近更新（2026-08-15）— v2.7 反向对齐小程序

**删除 Web 独有功能（19 项）**：智能混合模式（restore 旧会话归一化为 review）、运行时排序切换（队列固定 EF 升序）、全局搜索、键盘快捷键、移动端手势（滑动/长按/上滑朗读）、彩带、牌组导出、外部词书导入（文件/URL/粘贴）、系统通知提醒、备份提醒+数据备份区、云同步（SyncProvider 半成品死代码）、小程序引导条、卡片批量粘贴导入、演示数据、学习头部错题复习按钮、每日一句换一句按钮、新词数设置输入框、预览隐藏释义开关、错词 CSV 导出；LOCAL_KEYS 死数组清理

**保留**：PWA 离线/安装、拼写模式、预览搜索、卡片批量删除、统计面板、分享、错词本练习/移出、快速模式、内置词书导入、待复习 toast

**测试**：115→114（删除 nextQuote 用例 + wrong-words CSV 断言）

## 卡片数据结构（扩展）

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

- **ebbinghausStage** (0-7)：0=新词，1-6=复习阶段，7=已掌握
- **ebbinghausNextReview**：下次艾宾浩斯复习日期
- **ebbinghausHistory**：[{stage, date, passed}] 复习记录
- 兼容旧数据：initEbbinghaus() 自动迁移，无艾宾浩斯字段的卡片从 SM-2 状态推断初始阶段

## 艾宾浩斯遗忘曲线阶段

| 阶段 | 间隔 | 说明 |
|------|------|------|
| 0    | 0天  | 新学 |
| 1    | 1天  | 第一次复习 |
| 2    | 2天  | 第二次复习 |
| 3    | 4天  | 第三次复习 |
| 4    | 7天  | 第四次复习 |
| 5    | 15天 | 第五次复习 |
| 6    | 30天 | 第六次复习 |
| 7    | 90天 | 已掌握（不再主动推送复习）|

- 通过 → 推进到下一阶段
- 失败 → 回退到阶段 1，重新开始遗忘曲线
- SM-2 仍负责 easeFactor 调整（难度追踪）

## 学习进度持久化

- sessionStorage 保存当前学习队列（模式、队列、索引、成绩）
- beforeunload / visibilitychange 事件触发保存
- renderStudyPanel 时自动检查并恢复未完成的进度（30分钟过期）

## 数据规范化

- `App.getCardFront(c)` / `App.getCardBack(c)` 安全获取卡片正反面，自动处理 `front`/`word` 回退和 `definitions` 数组/字符串兼容
- `App._ensureDefinitionsArray(defs, fallback)` 确保 `definitions` 始终为数组格式
- `App.migrateCardsSchema()` 启动时自动修复旧数据：将非数组 definitions 包装为数组，补全缺失的 front/back 字段

## 已知限制

- **file:// 协议 Service Worker 同步抛异常**：Chrome 中 `navigator.serviceWorker.register()` 在 file:// 下同步抛出 TypeError，`.catch()` 无法捕获。修复方法：外层加 `try-catch`（index.html 和 scripts/build.js 同步处理）
- **预览面板搜索过滤后不记住状态**：切换到其他面板再返回预览时，搜索条件会被重置
- **`build.js` 移除内联 `<style>` 依赖 CSS 文件已有样式**：index.html 中内联的全局搜索和移动端样式已在 components.css 中冗余定义，构建时安全移除；如需新增内联样式必须先同步到对应 CSS 文件

## 构建

```
npm run build   -- esbuild 构建到 dist/
npm run dev     -- npx serve dist/ 本地预览
```

## 关键状态 key

- `flashcard-data` — 牌组 + 卡片 + SM-2 + 艾宾浩斯状态
- `flashcard-learning-log` — 每日学习记录（深度模式）
- `flashcard-quick-log` — 快速模式独立每日记录
- `flashcard-daily-goal` — 每日目标词数
- `flashcard-new-words-per-session` — 每轮新词学习数
- `flashcard-study-progress` — 学习进度（sessionStorage，含 mode 字段，quick 模式复用）
- `flashcard-theme` — 主题偏好
- `flashcard-tts-accent` — 发音口音偏好
- `flashcard-quote-date` / `flashcard-quote-index` — 每日一句（同日同句）
