# Study Tools

两个学习工具，同一套代码同时提供 **网页（PWA）/ Windows 桌面应用 / Android 应用**：

- **[English-web](english/English-web/)** — 基于艾宾浩斯遗忘曲线的英语词汇闪卡，内置 20 套词书（乱序 + 正序，约 28K 词，100% 音标）
- **[math-web](math/math-web/)** — 大学数学公式速查（React + KaTeX），覆盖 5 学科 34 章节 177 条公式

## 应用下载

发布包由 GitHub Actions 在打 tag 时自动构建，统一放在 [Releases](releases)：

| 平台 | 英语闪卡 | 数学公式 |
|------|----------|----------|
| Windows | `Flashcard-<版本>-win-x64-setup.exe` | `MathReference-<版本>-win-x64-setup.exe` |
| Android | `flashcard-<版本>-android.apk` | `math-reference-<版本>-android.apk` |
| 网页 | https://lx825-ai.github.io/study-tools/english/ | https://lx825-ai.github.io/study-tools/math/ |

- 桌面端是 Electron 安装包（NSIS），安装后离线可用。
- Android 包为 **debug 签名**，仅用于侧载安装（需在系统里允许「未知来源应用」）；上架应用商店需另配正式签名。
- iOS 暂不提供安装包，用 Safari 打开网页版「添加到主屏幕」即可获得 App 体验。

## 快速开始

```bash
# 网页开发与测试（根目录脚本）
npm run test:all      # 两端测试（English-web + math-web）
npm run build:all     # 两端构建产物

# 或单独操作
cd english/English-web && npm install && npm run build && npm test
cd math/math-web       && npm install && npm run build && npm test
```

## 打包 App

```bash
# Windows 安装包（需本机可下载 Electron，产物写入 dist-apps/）
npm run package:desktop:english
npm run package:desktop:math

# Android APK（需 JDK 21 + Android SDK；本机没有工具链时交给 CI）
npm run package:android:english
npm run package:android:math
```

发布流程：`git tag v1.0.0 && git push origin v1.0.0` → `.github/workflows/release.yml` 在 Windows/Ubuntu runner 上构建 4 个产物并汇总成一个 Release。

## 功能特性

### English-web 英语闪卡

| 功能 | 说明 |
|------|------|
| 艾宾浩斯调度 | 8 阶段（0/1/2/4/7/15/30/90 天）单轨间隔重复，EF 自适应间隔 |
| 词书 | 20 套（初/高中、四级、六级、考研 × 大纲/核心 × 乱序/正序），约 28K 词 |
| 学习模式 | 深度（动态队列重插）、今日复习（紧急度排序）、错题强化、快速浏览、拼写（纯练习） |
| 发音 | 有道音频，英/美音切换，失败自动重试 |
| 数据管理 | 牌组导入、卡片列表与批量删除、统计仪表盘（热力图/遗忘曲线）、JSON 导出导入同步 |
| 离线 | PWA Service Worker 缓存，桌面端与 Android 端为本地文件加载 |

### math-web 数学公式

| 功能 | 说明 |
|------|------|
| 公式速查 | 5 大学科 34 章节 177 条公式，KaTeX 渲染 |
| 搜索筛选 | 全文搜索、学科/难度筛选、搜索历史 |
| 收藏与最近 | 收藏夹、最近浏览记录 |
| 公式测验 | 选择题/闪卡模式、每日挑战、错题本 |
| 学习进度 | 章节级别已学/未学追踪 |
| 主题 | 自动/暗色/亮色三模式 |
| 离线 | Service Worker 预缓存、打印支持 |

## 项目结构

```
english/English-web/   -- 英语闪卡 PWA + 词书源数据（wordbooks-src/）
math/math-web/         -- 数学公式 PWA
apps/
  desktop-english/     -- Electron 壳（加载 English-web dist）
  desktop-math/        -- Electron 壳（加载 math-web dist）
  mobile-english/      -- Capacitor 壳（Android，加载 English-web dist）
  mobile-math/         -- Capacitor 壳（Android，加载 math-web dist）
.github/workflows/     -- ci.yml（测试+构建）、deploy.yml（Pages）、release.yml（App 发布）
```

## 技术栈

| | English-web | math-web | apps/ 桌面 | apps/ 移动 |
|------|------|------|------|------|
| 框架 | 纯 JavaScript (ES2017+) | React 18 + TypeScript | Electron 33 | Capacitor 7 |
| 构建 | esbuild | Vite 6 | electron-builder | Gradle + Android SDK |
| 公式渲染 | — | KaTeX | — | — |
| 测试 | Vitest（325 用例） | Vitest（48 用例） | — | — |
| 部署 | GitHub Pages | GitHub Pages | GitHub Releases | GitHub Releases |

## 文档

- 根目录 [CLAUDE.md](CLAUDE.md)：仓库级约定、命令、架构约束
- [english/English-web/CLAUDE.md](english/English-web/CLAUDE.md)：英语闪卡的学习算法、词书系统与同步协议
- [math/math-web/CLAUDE.md](math/math-web/CLAUDE.md)：数学公式应用的结构与约定
