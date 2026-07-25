# Study Tools

学习工具集合：两个 PWA 网页应用 + 两个微信小程序。

- **[English-web](English-web/)** — 基于 SM-2 间隔重复算法的英语词汇闪卡 PWA，内置高考/CET-4/CET-6/考研 5 套词书（~22K 词）
- **[English-mini-app](English-mini-app/)** — 英语背单词微信小程序（uni-app + 微信云开发）
- **[math-web](math-web/)** — 大学数学公式速查 PWA（React + KaTeX），覆盖 5 学科 34 章节 177 条公式
- **[math-mini-app](math-mini-app/)** — 数学公式速查微信小程序（uni-app + 自研 Canvas 公式渲染引擎 + 云端同步）

## 快速开始

```bash
# 安装依赖（根目录 workspace 脚本）
npm run test:all     # 运行全部测试
npm run build:all    # 构建全部项目

# 或单独操作
cd English-web   && npm install && npm run build
cd math-web      && npm install && npm run build
cd math-mini-app && npm install && npm test && npm run build:mp-weixin
```

## 线上访问

| 工具 | 地址 |
|------|------|
| 英语闪卡 | https://lx825-ai.github.io/study-tools/english/ |
| 数学公式 | https://lx825-ai.github.io/study-tools/math/ |

## 功能特性

### English-web 英语闪卡

| 功能 | 说明 |
|------|------|
| SM-2 间隔重复 | 自适应难度调度，到期卡片优先复习 |
| 词书 | 高考 (~3.5K)、四级 (~4.5K)、六级核心 (~2.1K)、六级大纲 (~6.4K)、考研 (~5.5K) |
| 音标 | 全部词条已填充音标（ECDICT 词典匹配，99.8% 覆盖率） |
| 导入 | 内置词书一键导入、文件导入 (JSON/CSV/TXT)、粘贴 JSON、从 URL 获取 |
| 学习模式 | 翻卡模式、打字模式 |
| 数据管理 | 牌组 CRUD、批量导入、JSON/CSV 导出、全部数据备份与恢复 |
| PWA | Service Worker 离线缓存、独立窗口运行 |

### math-web 数学公式（PWA）

| 功能 | 说明 |
|------|------|
| 公式速查 | 5 大学科 34 章节 177 条公式，KaTeX 渲染 |
| 搜索筛选 | 全文搜索、学科/难度筛选、搜索历史 |
| 收藏与最近 | 收藏夹、最近浏览记录 |
| 公式测验 | 选择题/闪卡模式、每日挑战、错题本 |
| 学习进度 | 章节级别已学/未学追踪 |
| 主题 | 自动/暗色/亮色三模式 |
| PWA | Service Worker 预缓存、离线可用、打印支持 |

### English-mini-app 英语背单词（微信小程序）

| 功能 | 说明 |
|------|------|
| 学习模式 | 快速模式 / 深度模式（连续答对3次掌握） |
| 生词本 | 手动⭐标记，支持搜索和移除 |
| 词书 | 20套考试词书（初中/高中/四级/六级/考研 × 大纲/核心 × 正序/乱序） |
| 拼写模式 | 手机键盘自适应布局 |
| 会话持久化 | 页面重建后2小时内自动恢复 |
| 数据管理 | 卡片数据使用文件系统，突破 Storage 1MB 限制 |
| 隐私政策 | 完善的8章节隐私政策，符合审核要求 |

### math-mini-app 数学公式（微信小程序）

| 功能 | 说明 |
|------|------|
| 公式渲染 | 自研 LaTeX→Canvas 引擎（tokenizer→parser→renderer 三阶段管线 + LRU 缓存），渲染失败自动降级纯文本 |
| 公式速查 | 与 math-web 同源 177 条公式，章节浏览 + 全文搜索（300ms 防抖 + 学科/难度筛选） |
| 学习功能 | 选择题/闪卡测验、每日挑战（连续打卡 emoji 阶梯）、错题本、进度追踪 |
| 个人笔记 | 每条公式 Markdown 笔记，云端同步 |
| 云端同步 | 本地优先 + 离线队列 + 增量同步（微信云开发 6 集合 4 云函数） |
| 主题 | 自动/暗色/亮色 + 公式字号三档 |

## 技术栈

| | English-web | English-mini-app | math-web | math-mini-app |
|------|---------|---------|------|------|
| 框架 | 纯 JavaScript (ES2017+) | uni-app (Vue 3) | React 18 + TypeScript | uni-app (Vue 3 + TS) |
| 构建 | esbuild | Vite 5 | Vite 6 | Vite 5 |
| 公式渲染 | — | — | KaTeX | 自研 Canvas 引擎 |
| 后端 | — | 微信云开发 | — | 微信云开发 |
| 测试 | Vitest (43 tests) | Vitest (97 tests) | Vitest (48 tests) | Vitest (45 tests) |
| 部署 | GitHub Pages | 微信小程序 | GitHub Pages | 微信小程序（待上架） |
