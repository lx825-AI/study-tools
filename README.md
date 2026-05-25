# Study Tools

学习工具集合，包含两个 PWA 应用：

- **[English](English/)** — 基于 SM-2 间隔重复算法的英语词汇闪卡 PWA，内置高考/CET-4/CET-6/考研 5 套词书（~22K 词），支持音标、词组、例句等富数据卡片
- **[Math](math/)** — 大学数学公式速查表 PWA，覆盖高数、线代、离散、概率统计 ~123 条公式，支持 KaTeX 渲染、收藏、测验

## 快速开始

```bash
# 安装依赖（根目录 workspace 脚本）
npm run test:all     # 运行全部测试
npm run build:all    # 构建全部项目

# 或单独操作
cd English && npm install && npm run build
cd math   && npm install && npm run build
```

## 线上访问

| 工具 | 地址 |
|------|------|
| 英语闪卡 | https://lx825-ai.github.io/study-tools/english/ |
| 数学公式 | https://lx825-ai.github.io/study-tools/math/ |

## 功能特性

### English 英语闪卡

| 功能 | 说明 |
|------|------|
| SM-2 间隔重复 | 自适应难度调度，到期卡片优先复习 |
| 词书 | 高考 (~3.5K)、四级 (~4.5K)、六级核心 (~2.1K)、六级大纲 (~6.4K)、考研 (~5.5K) |
| 音标 | 全部词条已填充音标（ECDICT 词典匹配，99.8% 覆盖率） |
| 导入 | 内置词书一键导入、文件导入 (JSON/CSV/TXT)、粘贴 JSON、从 URL 获取 |
| 学习模式 | 翻卡模式、打字模式 |
| 数据管理 | 牌组 CRUD、批量导入、JSON/CSV 导出、全部数据备份与恢复 |
| PWA | Service Worker 离线缓存、独立窗口运行 |

### Math 数学公式

| 功能 | 说明 |
|------|------|
| 公式速查 | 4 大学科 22 章节 ~123 条公式，KaTeX 渲染 |
| 搜索筛选 | 全文搜索、学科/难度筛选、搜索历史 |
| 收藏与最近 | 收藏夹、最近浏览记录 |
| 公式测验 | 选择题模式（看名称选 LaTeX），历史成绩追踪 |
| 学习进度 | 章节级别已学/未学追踪 |
| 主题 | 自动/暗色/亮色三模式 |
| PWA | Service Worker 预缓存、离线可用、打印支持 |

## 技术栈

| | English | Math |
|------|---------|------|
| 框架 | 纯 JavaScript (ES2017+) | React 18 + TypeScript |
| 构建 | esbuild | Vite 6 |
| 公式渲染 | — | KaTeX |
| 测试 | Vitest (43 tests) | Vitest (48 tests) |
| CI/CD | GitHub Actions | GitHub Actions |
| 离线 | Service Worker | Service Worker |
| 部署 | GitHub Pages | GitHub Pages |
