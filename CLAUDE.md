# study-tools monorepo

英语词汇学习 + 数学公式速查工具仓库，四个独立子项目。

## 项目结构

```
English-web/       -- 英语闪卡 PWA（纯 JS，esbuild）
English-mini-app/  -- 英语背单词 uni-app（Vue 3 + 微信云开发）→ 详见子目录 CLAUDE.md
math-web/          -- 数学公式 PWA（React + TS + Vite + KaTeX）
math-mini-app/     -- 数学公式小程序（uni-app + Vue 3 + TS + Pinia）
```

## 构建与测试

| 项目 | 构建 | 测试 |
|------|------|------|
| English-web | `npm run build` | `npm test` |
| English-mini-app | `npm run build:mp-weixin` | 189 用例（Vitest） |
| Math-web | `npm run build` | `npm test` |
| math-mini-app | `npm run build:mp-weixin` | 45 用例 |

全量：`npm run test:all`

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- English-mini-app: 微信小程序（appid 已配置，待审核）
- math-mini-app: 微信小程序（appid 待配置）
- GitHub Pages + Actions 自动部署

## 最近更新（2026-08-01）— English-mini-app v2.3

**功能修复（7项）**：复习队列软上限、快速模式统计聚合、useSessionRecovery 集成、wrongDates 写入、错词队列连接、阶段推进限 0→1、effectiveMode 判断

**模式审查（7项）**：goPrevCard returnIndex、onSpellResult 模式感知+深度跟踪、_consecutiveFails 清零、提示修正、lastCardId 全模式、首页队列量

**艾宾浩斯修复**：easeFactor 自适应间隔恢复（CRITICAL）、逾期门控 prevStage、NaN 检查、删冗余 init/fuzzy

**云函数**：16 个自包含化（删 common/）、wx-server-sdk ~2.6.0、CLI 批量部署

**UI**：decks 底部工具栏（错词+生词）、mine 清理、完成页删海报

**测试**：180→189（ebbinghaus +9）

---

*详细更新记录见 `English-mini-app/CLAUDE.md`*
