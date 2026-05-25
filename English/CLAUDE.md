# English Flashcard PWA

SPA 英语词汇闪卡应用，使用 SM-2 间隔重复算法。纯 JavaScript，零运行时依赖。

## 项目结构

```
index.html          -- SPA 入口
js/
  app.js            -- init()、全局搜索、语音朗读、彩带、快捷键
  state.js          -- 全局状态、getDeck/getCurrentDeck
  storage.js        -- localStorage 读写
  models.js         -- ID 生成、难度计算、词规范化
  utils.js          -- HTML 转义、CSV 解析、Levenshtein 模糊搜索
  ui.js             -- 牌组选择渲染、面板切换、导航徽章
  deck-panel.js     -- 牌组 CRUD + JSON/CSV 导出
  study-panel.js    -- SM-2 算法、学习队列、翻卡渲染
  typing-panel.js   -- 打字模式
  preview-panel.js  -- 表格预览、搜索、隐藏答案
  cards-panel.js    -- 卡片列表、批量操作、导入
  import.js         -- 内置词书注册表、script 动态加载、文件导入
  stats-panel.js    -- 学习日志、连续打卡、周统计、热力图
data/
  word-schema.js    -- 扩展词格式校验与规范化
css/                -- 8 个 CSS 文件（variables/base/components/deck/study/typing/preview/stats）
wordbooks/          -- 5 套词书（JS 格式，注册到 window.__VOCAB_REGISTRY__）
  senior-high-enriched.js   -- 高考词书 (~3500 词)
  cet4-syllabus-enriched.js -- 四级词书 (~4541 词)
  cet6-core-enriched.js     -- 六级核心 (~2138 词)
  cet6-syllabus-enriched.js -- 六级大纲 (~6363 词)
  kaoyan-enriched.js        -- 考研词书 (~5500 词)
scripts/
  build.js           -- esbuild 构建（CSS 合并、JS 打包、词书 JSON 转换）
  merge-cet6-syllabus.js -- CET-6 词书合并脚本
```

## 架构约定

- **IIFE 命名空间**：所有代码挂在 `window.FlashcardApp` 上，文件间通过 `FlashcardApp.xxx` 共享
- **变量风格**：当前使用 `var`（无块作用域）。后续迭代将替换为 `const`/`let`
- **DOM 操作**：直接操作 DOM，无虚拟 DOM / 框架

## 构建

```
npm run build   -- esbuild 构建到 dist/（CSS 合并、JS 打包+压缩、词书 .js→.json 转换、HTML 组装）
npm run dev     -- npx serve dist/ 本地预览
```

## 词书格式

每套词书是 JS 文件，调用 `window.__VOCAB_REGISTRY__.register()` 注册。词条格式：

```json
{
  "word": "abandon",
  "phonetic": "/əˈbændən/",
  "pos": "v.",
  "definitions": ["丢弃；放弃"],
  "phrases": [{ "en": "abandon oneself to", "zh": "沉溺于" }],
  "sentences": [{ "en": "...", "zh": "..." }],
  "synonyms": ["desert"],
  "antonyms": ["keep"],
  "confused": ["abundant"]
}
```

注意：当前词书的 phonetic/phrases/sentences/synonyms/antonyms/confused 字段多为空，卡背富 UI 已完备但数据待充实。

## 关键状态 key

- `flashcard-data` — 牌组 + 卡片 + SM-2 状态
- `flashcard-learning-log` — 每日学习记录
- `flashcard-daily-goal` — 每日目标词数
- `flashcard-demo-seeded` — 是否已注入 demo 数据
- `flashcard-theme` — 主题偏好
