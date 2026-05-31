# English Flashcard PWA

SPA 英语词汇闪卡应用，使用 SM-2 间隔重复 + 艾宾浩斯遗忘曲线算法。纯 JavaScript，零运行时依赖。

## 学习模式

- **📖 学习新词**：从未学过的单词开始第一轮学习
- **🔁 今日复习**：按艾宾浩斯遗忘曲线复习今日到期的单词
- **🎯 智能混合**：复习优先 + 新词补充，高效利用时间
- **📋 错题强化**：集中攻克所有牌组中 EF≤1.8 的难词
- **⌨️ 打字练习**：看中文释义听发音拼写英文，双重验证记忆

## 项目结构

```
index.html          -- SPA 入口
js/
  app.js            -- init()、全局搜索、语音朗读、彩带、快捷键、beforeunload
  state.js          -- 全局状态、getDeck/getCurrentDeck
  idb-storage.js    -- IndexedDB 主存储 + localStorage 降级备份（突破5MB限制，数据精简压缩）
  models.js         -- ID 生成、难度计算、词规范化
  utils.js          -- HTML 转义、CSV 解析、Levenshtein 模糊搜索、getCardFront/getCardBack 安全取值
  ebbinghaus.js     -- 艾宾浩斯遗忘曲线：8阶段复习调度、到期检测、逾期排序
  ui.js             -- 牌组选择渲染、面板切换、导航徽章
  deck-panel.js     -- 牌组 CRUD + JSON/CSV 导出
  study-panel.js    -- 多模式学习 + 拼写模式 + SM-2/艾宾浩斯作答 + 进度持久化
  typing-panel.js   -- 打字模式（⌨️ 独立面板，看中文释义输入英文）
  preview-panel.js  -- 表格预览、搜索、高亮、隐藏答案
  cards-panel.js    -- 卡片列表（100+ 虚拟滚动）、批量操作、导入
  import.js         -- 内置词书注册表、script 动态加载、文件导入
  stats-panel.js    -- 学习日志、连续打卡、周统计、热力图、艾宾浩斯分布
data/
  word-schema.js    -- 扩展词格式校验与规范化、_ensureDefinitionsArray 数组保证、migrateCardsSchema 数据迁移
css/                -- 10 个 CSS 文件
  variables.css / base.css / components.css / deck.css
  study.css / mode.css / typing.css / preview.css / stats.css
wordbooks/          -- 5 套词书（JS 格式，注册到 window.__VOCAB_REGISTRY__）
scripts/
  build.js           -- esbuild 构建（CSS 合并、JS 打包、词书复制、HTML 组装）
```

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
- **打字面板无独立进度持久化**：打字模式的学习进度在页面刷新后会丢失，仅学习面板（study）支持 sessionStorage 持久化恢复
- **`build.js` 移除内联 `<style>` 依赖 CSS 文件已有样式**：index.html 中内联的全局搜索和移动端样式已在 components.css 中冗余定义，构建时安全移除；如需新增内联样式必须先同步到对应 CSS 文件

## 构建

```
npm run build   -- esbuild 构建到 dist/
npm run dev     -- npx serve dist/ 本地预览
```

## 关键状态 key

- `flashcard-data` — 牌组 + 卡片 + SM-2 + 艾宾浩斯状态
- `flashcard-learning-log` — 每日学习记录
- `flashcard-daily-goal` — 每日目标词数
- `flashcard-new-words-per-session` — 每轮新词学习数
- `flashcard-study-progress` — 学习进度（sessionStorage）
- `flashcard-theme` — 主题偏好
- `flashcard-tts-accent` — 发音口音偏好
