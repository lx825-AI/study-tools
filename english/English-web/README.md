# 📚 Flashcard 抽认卡 — 英语学习 PWA

基于艾宾浩斯遗忘曲线算法的英语单词学习工具，内置 10 套词书（初中至考研），功能与微信小程序版对齐，可离线使用。

## 功能

- **翻卡学习** — 艾宾浩斯遗忘曲线单轨算法，四种学习模式（新词/复习/错题/快速浏览）
- **快速浏览模式** — 线性过词快速刷词，进度独立记录（`flashcard-quick-log`），不污染深度复习的艾宾浩斯历史
- **错题强化** — 学习模式选择页集中攻克 EF≤1.8 难词，附错词列表浏览与单卡移出
- **拼写模式** — 学习中内嵌拼写验证，看释义输入英文，自动判断正误
- **TTS 发音** — 单词朗读，支持英式/美式口音一键切换
- **每日一句** — 牌组页顶部英文名言（含中文释义），同日同句
- **预览浏览** — 表格模式快速浏览词库，大量卡片自动启用虚拟滚动（200+），支持搜索、高亮
- **卡片编辑** — 增删卡片、批量选择与删除
- **学习统计** — 每日学习量、连续打卡、周热力图、每日目标
- **内置词书** — 10 套（初中/高中/四级/六级/考研 × 大纲/核心），100% 音标覆盖，含词组/例句/同反义词；导入弹窗按「级别 → 大纲/核心」两级分类（与小程序一致）
- **离线 PWA** — Service Worker 缓存，无网络也能学习
- **暗色模式** — 支持亮色/暗色主题切换

## 技术栈

纯原生 JavaScript，零运行时依赖。使用 esbuild 构建打包。

## 在线访问

**[lx825-ai.github.io/study-tools/english/](https://lx825-ai.github.io/study-tools/english/)**

## 开发

```bash
npm install            # 安装构建工具
npm run gen:wordbooks  # 从小程序词书 JSON 生成 10 套词书（数据源: ../English-mini-app/wordbooks-cloud/）
npm run build          # 构建到 dist/
npm run dev            # 本地预览 (需要 npx serve)
npm test               # vitest 测试（229 用例）
```

## 词书

10 套词书由 [scripts/gen-wordbooks.js](scripts/gen-wordbooks.js) 从小程序词书 JSON（`English-mini-app/wordbooks-cloud/`）生成，数据源自 KyleBing/english-vocabulary（MIT），100% 音标覆盖。生成产物为紧凑单行 JSON 的 JS 文件（约 8MB），SW 仅预缓存 2 本最常用词书，其余按需 runtime 缓存。

## 数据存储

所有学习数据存储在浏览器 IndexedDB（主存储）+ localStorage（降级备份）中，包括牌组、卡片、SM-2 复习状态、艾宾浩斯遗忘曲线数据和学习日志。启动时自动运行数据迁移（`migrateCardsSchema`）修复旧格式数据。

## 数据格式

卡片支持两种格式：
- **简单格式**：`{ front: "abandon", back: "丢弃；放弃" }`
- **扩展格式**：`{ word, phonetic, pos, definitions[], phrases[], sentences[], synonyms[], antonyms[], confused[] }`

`definitions` 字段会自动规范化为数组格式，兼容字符串输入。

---

## English Flashcard PWA

A spaced-repetition English vocabulary learning tool with 10 built-in wordbooks (junior high to postgraduate), feature-aligned with the WeChat mini-program version. Works fully offline as a PWA.

### Features

- SM-2 + Ebbinghaus dual-algorithm spaced repetition with four study modes (new/review/failed/quick)
- Quick browse mode with independent progress tracking
- Failed-words reinforcement in study-mode selection with browse & remove list
- TTS pronunciation with British/American accent switching
- Daily English quote with Chinese translation
- Built-in wordbooks: 10 books (junior/senior high, CET-4/6, postgraduate × syllabus/core), 100% phonetic coverage
- Learning statistics with daily goals, heatmaps, and session timing
- PWA offline support with Service Worker
- Light/dark theme

### Development

```bash
npm install && npm run gen:wordbooks   # Generate wordbooks from mini-app JSON
npm run build                          # Build to dist/
npm run dev                            # Local preview
```
