# English Flashcard PWA

SPA 英语词汇闪卡应用，使用艾宾浩斯遗忘曲线算法（v2.8 起单轨，SM-2 已删除）。纯 JavaScript，零运行时依赖。功能与微信小程序版（English-mini-app）对齐。

## 学习模式（v2.8 起与小程序行为完全一致）

- **📖 学习新词（深度模式）**：动态队列——答完 splice 移除后按阶段重插（答错 idx+3；答对 stage≤1→idx+5、stage2→idx+10、stage3→idx+15），出现≥3次或阶段≥4 永久移出（wordsCompleted+1）；计数点 ●●○；「← 上一个」回看
- **🔁 今日复习**：到期词按紧急度综合评分排序（逾期 10/20/35/50 + 阶段 5/10/15 + EF 5/10/15 + wrongCount 0/5/10），软上限 50
- **📋 错题强化**：集中攻克所有牌组中 EF≤1.8 且已学过的难词
- **⚡ 快速浏览**：队列仅 stage<5（新词→到期→逾期降序→阶段升序，截断到每日目标）；答对仅 stage 0→1（经 applyEbbinghaus：EF+0.1、reps+1、写一条历史；stage>0 答对原样保留）；答错 wrongCount++/wrongDates/_consecutiveFails++
- **⌨️ 拼写模式（纯练习）**：学习中内嵌；**盲拼槽位输入**（卡片正面按单词字母数渲染单字符输入框，逐格输入自动跳格、输满末槽自动判定；词间 gap 间隔、连字符/撇号固定展示不可输入、判定时两侧统一剥除非字母——"don't" 填 dont 判对；词形/音标/难度/计数点全隐藏，点卡片不翻转防泄漏背面释义）；对/错均停留当前词（正确 ✅+清空可重拼；错误 ❌+正确答案+槽位红框 shake，600ms 后清空重拼），**不推进队列、不改遗忘曲线、不写学习日志**；拼写期间隐藏会了/不会按钮，退出后恢复作答；槽位生成纯函数 `buildSpellSlotHtml`、事件委托在 study-panel.js IIFE 顶层（document input/keydown/focusin）
- **回看态按钮灰暗**：点「← 上一个」回看后会了/不会按钮 disabled + opacity 0.35（对齐小程序 answer-buttons.dimmed），仅作查看不可重新作答
- **🔊 自动发音**：每次换卡 300ms 后自动朗读当前词（对齐小程序 speakCurrentCard）；仅学习面板可见时播放（防后台 renderAll 误发声）；`_speakTimer` 防重复渲染叠加播放
- **作答按钮**：会了/不会直接作答推进（无"未翻转先翻卡"守卫），翻转仅由点击卡片触发

## 学习算法（v2.8 单轨）

- **SM-2 已删除**：EF/repetitions 统一由 `applyEbbinghaus(card, passed, quality)` 维护；调度日期仅 `ebbinghausNextReview`（旧 nextReview/interval/difficulty 字段冻结保留，不再写入）
- 答对：stage++（quality==='correct'）、EF+0.1（封顶 3.5）、reps+1、间隔自适应 `round(interval×EF/2.5)` 下限 1、逾期>7天且 prevStage>1 降 1 级门控、history 带 quality
- 答错：智能回退（stage≤2 或连败≥2 → 1，否则退 1 级）+ 逾期惩罚（1-3天 0/4-7天 1/>7天 2）取 min 不叠加、EF-0.2（下限 1.3）、reps=0、_consecutiveFails++
- 会话恢复 TTL 2 小时；旧线性 new 快照恢复时 index 重置迁移
- 统计落库：会话完成时按卡去重汇总（当日覆盖语义），日志结构 `{date, cardsStudied, correct, wrong, duration, completedGoal}`；已掌握口径 = ebbinghausStage≥7

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
  quick-mode.js     -- 快速浏览模式（startQuickMode/applyQuickResult/loadQuickLog）
  study-panel.js    -- 多模式学习 + 拼写模式（⌨️ 内嵌）+ 艾宾浩斯作答（单轨）+ 进度持久化
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

## 最近更新（2026-08-20）— 学习交互 4 项修复（对齐小程序）

**自动播放发音**：renderStudyPanel 末尾换卡 300ms 后自动朗读当前词（对齐小程序 speakCurrentCard）；仅 `#panelStudy.visible` 时播放（renderAll 后台渲染不发声）；`_speakTimer` 每次先清后设防叠加

**会了/不会直答**：删除 answerStudy「未翻转先翻卡并 return」守卫——按钮点击直接作答推进；翻转仅由点击卡片触发（对齐小程序 markAnswer）

**拼写纯练习 + 盲拼**（有意偏离小程序：按用户要求拼写不参与进度）：checkSpelling 重写为对/错均停留当前词（✅/❌ 反馈、输入清空可重拼/重试），不调 answerStudy → 零队列推进/零调度改写/零日志污染；盲拼正面仅 🔒 占位 + 发音提示（词形/音标/难度/计数点/阶段徽章全隐藏）；拼写模式禁止翻卡（app.js 守卫改按 spellMode 拦截，防泄漏背面释义）；拼写期间隐藏会了/不会按钮；toggleSpellMode 薄壳化（UI 集中于 renderStudyPanel 重建）；spellAnswered 字段及 8 处引用全删除；4 个 start 入口加 spellMode 防御重置

**测试**：175→187（自动播放 4、会了/不会直答 2、拼写纯练习 4、盲拼/toggle 2；setup.js 新增 window.mountStudyDOM 共享 DOM 桩）；Playwright 端到端 23/23 通过

**追加打磨（2026-08-20）**：盲拼提示改下划线遮罩——正面按单词字母数显示带间隔下划线（`buildSpellBlindMask` 纯函数：字母→`_`、按空白分组、连字符/撇号原样保留）+ 保留「听发音拼写」辅助文字；回看态会了/不会按钮灰暗处理（disabled + opacity 0.35，对齐小程序 dimmed，仅作查看不可重新作答）；测试 187→192；Playwright 端到端 10/10 通过

**槽位式输入改造（2026-08-20）**：删除下方独立输入框+确认按钮（index.html spellInputArea 整块删除、app.js 三处旧绑定删除、mode.css 旧 input 样式清理），改为卡片正面下划线处逐格输入字母——`buildSpellSlotHtml` 纯函数渲染单字符槽位（字母→input 槽连续编号、空白→gap 间隔、撇号/连字符→固定展示）；document 事件委托（input 过滤+自动跳格+末槽全满自动判定 / Backspace 空槽回退 / focusin 键盘避让，绑定于 study-panel.js IIFE 顶层因测试不加载 app.js）；checkSpelling 槽位化（守卫顺序不变，两侧剥除非字母归一化——dont 判对）；错误：槽位红框 shake+禁入，600ms 后清空重拼（App._spellWrongTimer 双清防跨卡残留）；toggleSpellMode 加回看守卫+聚焦首槽；测试 192→199；Playwright 端到端 15/15 通过

## 最近更新（2026-08-19）— v2.8 学习算法全量对齐小程序

**单轨化**：删除 SM-2（applySM2 与 nextReview/interval 双轨），applyEbbinghaus 重写为小程序 ES5 等价实现——智能回退（连败≥2 才回 1 级）、逾期惩罚不叠加、EF 自适应间隔（+0.1/-0.2、封顶 3.5/下限 1.3）、逾期>7天答对降级门控、history 带 quality、initEbbinghaus 防御（NaN/夹紧/截断 100）

**深度动态队列**：新词模式 splice 重插（错+3/对+5/+10/+15）、出现≥3次或阶段≥4 移出、●●○ 计数点、回看按钮；进度显示"已学 N/M 词"

**快速模式**：队列 stage<5 + 优先级排序 + dailyGoal 截断；答对仅 0→1（已学词不再被降级——修复核心 bug）；答错 wrongCount/wrongDates 追踪

**复习模式**：calcUrgencyScore 紧急度排序 + 软上限 50

**统计**：逐答计数改为会话完成按卡去重汇总（当日覆盖），日志含 duration/completedGoal；已掌握口径 stage≥7

**测试**：123→163（ebbinghaus 改写+16、quick-mode 重写、study-queue +9、deep-mode +10、stats-panel +8）

**审查修复（2026-08-19）**：与小程序逐行比对后修复 7 项——回看态守卫移至 answerStudy/checkSpelling 首行（防拼写绕过改写调度+污染统计）、quick 分支空卡守卫（防删卡后 TypeError）、exitReviewMode 清理残留会话（防旧统计复显）、快照存 elapsed 恢复重锚 startTime（时长不计关闭空闲，对齐 timerSeconds 口径）、完成面板 ✅/❌ 与 accuracy 统一按卡去重口径、恢复快照与牌组做 id 交叉校验、returnToModeSelect 已完成会话不再覆盖日志；每日目标默认 20→10 + NaN 兜底（对齐小程序）；测试 163→175

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

- **ebbinghausStage** (0-7)：0=新词，1-6=复习阶段，7=已掌握（90 天后仍会到期再进复习队列，与小程序一致）
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

- 通过 → 推进到下一阶段（quality='correct'）；逾期>7 天且 prevStage>1 时答对触发降级门控
- 失败 → 智能回退（stage≤2 或连败≥2 → 阶段 1，否则退 1 级）+ 逾期惩罚取 min 不叠加
- easeFactor/repetitions 由 applyEbbinghaus 统一维护（EF+0.1/-0.2、间隔 ×EF/2.5 自适应）

## 学习进度持久化

- sessionStorage 保存当前学习队列（模式、队列、索引、成绩）
- beforeunload / visibilitychange 事件触发保存
- renderStudyPanel 时自动检查并恢复未完成的进度（2 小时过期；快照存累计 elapsed 秒，恢复时重锚 startTime 不计关闭空闲）

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

- `flashcard-data` — 牌组 + 卡片 + 艾宾浩斯状态（SM-2 字段已退役保留）
- `flashcard-learning-log` — 每日学习记录（深度模式）
- `flashcard-quick-log` — 快速模式独立每日记录
- `flashcard-daily-goal` — 每日目标词数
- `flashcard-new-words-per-session` — 每轮新词学习数
- `flashcard-study-progress` — 学习进度（sessionStorage，含 mode 字段，quick 模式复用）
- `flashcard-theme` — 主题偏好
- `flashcard-tts-accent` — 发音口音偏好
- `flashcard-quote-date` / `flashcard-quote-index` — 每日一句（同日同句）
