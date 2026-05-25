# 📚 Flashcard 抽认卡 — 英语学习 PWA

基于间隔重复（SM-2 算法）的英语单词学习工具，支持 CET-4 / CET-6 词书，可离线使用。

## 功能

- **翻卡学习** — SM-2 间隔重复算法，自动安排复习计划
- **打字练习** — 输入英文单词验证记忆
- **预览浏览** — 表格模式快速浏览词库，支持搜索
- **卡片编辑** — 增删卡片、批量粘贴导入
- **学习统计** — 每日学习量、连续打卡、周热力图
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

所有学习数据存储在浏览器 `localStorage` 中，包括牌组、卡片、SM-2 复习状态和学习日志。

---

## English Flashcard PWA

A spaced-repetition English vocabulary learning tool for Chinese CET-4/CET-6 exam preparation. Works fully offline as a PWA.

### Features

- SM-2 spaced repetition algorithm
- Multiple study modes: flashcard flip, typing recall, table preview
- Built-in wordbooks: Senior High (3500), CET-4 (4541), CET-6 core (2138), CET-6 full (6363), Postgraduate (5500)
- Custom wordbook import: file (JSON/CSV/TXT), paste JSON, fetch from URL
- Learning statistics with daily goals and heatmaps
- PWA offline support with Service Worker
- Light/dark theme

### Development

```bash
npm install && npm run build   # Build to dist/
npm run dev                    # Local preview
```
