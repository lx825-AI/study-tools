# Study Tools

学习工具集合，包含两个 PWA 应用：

- **[English](English/)** — 基于 SM-2 间隔重复算法的英语单词学习工具，内置 CET-4/CET-6 词书
- **[Math](math/)** — 大学数学公式速查表，覆盖高数、线代、离散、概率统计，支持 KaTeX 渲染

## 快速开始

```bash
# English
cd English && npm install && npm run build

# Math
cd math && npm install && npm run build
```

## 线上访问

| 工具 | 地址 |
|------|------|
| 英语闪卡 | https://lx825-ai.github.io/study-tools/english/ |
| 数学公式 | https://lx825-ai.github.io/study-tools/math/ |

## 技术栈

| | English | Math |
|------|---------|------|
| 框架 | 纯 JavaScript | React 18 + TypeScript |
| 构建 | esbuild | Vite 6 |
| 公式渲染 | — | KaTeX |
| 测试 | — | Vitest |
| 离线 | Service Worker | Service Worker |
| 部署 | GitHub Pages | GitHub Pages |
