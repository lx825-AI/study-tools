# 📚 Flashcard 抽认卡 — 英语学习 PWA

基于间隔重复（SM-2 算法）的英语单词学习工具，支持 CET-4 / CET-6 词书，可离线使用。

## 功能

- **翻卡学习** — SM-2 + 艾宾浩斯遗忘曲线双算法，四种学习模式（新词/复习/混合/错题），三种排序（智能/乱序/正序）
- **拼写模式** — 学习中内嵌拼写验证，看释义输入英文，自动判断正误
- **打字练习** — 独立打字面板，看中文释义拼写英文，支持全牌组/错题打字，自动更新 SM-2 和艾宾浩斯状态
- **TTS 发音** — 单词朗读，支持英式/美式口音一键切换
- **预览浏览** — 表格模式快速浏览词库，支持搜索、高亮和单词朗读
- **卡片编辑** — 增删卡片、批量粘贴导入
- **学习统计** — 每日学习量、连续打卡、周热力图、学习用时统计
- **学习提醒** — 可设置每日定时提醒，支持系统通知
- **内置词书** — 高考 3500 词、四级大纲 4541 词、六级核心 2138 词、六级完整大纲 6363 词、考研 5500 词
- **外部导入** — 支持文件导入 (JSON/CSV/TXT)、粘贴 JSON 导入、从链接获取词书
- **离线 PWA** — Service Worker 缓存，无网络也能学习
- **暗色模式** — 支持亮色/暗色主题切换

## 技术栈

纯原生 JavaScript，零运行时依赖。使用 esbuild 构建打包。

## 开发

```bash
npm install        # 安装构建工具
npm run build      # 构建到 dist/
npm run dev        # 本地预览 (需要 npx serve)
```

## 数据存储

所有学习数据存储在浏览器 IndexedDB（主存储）+ localStorage（降级备份）中，包括牌组、卡片、SM-2 复习状态、艾宾浩斯遗忘曲线数据和学习日志。启动时自动运行数据迁移（`migrateCardsSchema`）修复旧格式数据。

## 数据格式

卡片支持两种格式：
- **简单格式**：`{ front: "abandon", back: "丢弃；放弃" }`
- **扩展格式**：`{ word, phonetic, pos, definitions[], phrases[], sentences[], synonyms[], antonyms[], confused[] }`

`definitions` 字段会自动规范化为数组格式，兼容字符串输入。

---

## English Flashcard PWA

A spaced-repetition English vocabulary learning tool for Chinese CET-4/CET-6 exam preparation. Works fully offline as a PWA.

### Features

- SM-2 + Ebbinghaus dual-algorithm spaced repetition with four study modes (new/review/mixed/failed)
- TTS pronunciation with British/American accent switching
- Multiple study modes: flashcard flip + spell check, independent typing panel, table preview with search
- Built-in wordbooks: Senior High (3500), CET-4 (4541), CET-6 core (2138), CET-6 full (6363), Postgraduate (5500)
- Custom wordbook import: file (JSON/CSV/TXT), paste JSON, fetch from URL
- Learning statistics with daily goals, heatmaps, and session timing
- Daily study reminder with system notification support
- PWA offline support with Service Worker
- Light/dark theme

### Development

```bash
npm install && npm run build   # Build to dist/
npm run dev                    # Local preview
```
