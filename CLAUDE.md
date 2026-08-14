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
| English-mini-app | `npm run build:mp-weixin` | 220 用例（Vitest） |
| Math-web | `npm run build` | `npm test` |
| math-mini-app | `npm run build:mp-weixin` | 45 用例 |

全量：`npm run test:all`

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- English-mini-app: 微信小程序（appid 已配置，待审核）
- math-mini-app: 微信小程序（appid 待配置）
- GitHub Pages + Actions 自动部署

## 最近更新（2026-08-14）— English-mini-app v2.6

**英式发音**：新增 `getAccentPreference()` 统一读取发音偏好，study/preview/spell 三处硬编码 'us' 全部接通，有道 dictvoice type=1 英式发音生效；tts.js 抽出 `buildTtsUrl` 纯函数

**审核前打磨**：submitFeedback/postAnnouncement 接入内容安全检测 msgSecCheck v2（违规拒绝入库）；废弃 API `getSystemInfoSync` 全量迁移；首页注册分享（`onShareAppMessage`）

**主题全覆盖**：16 页全部支持深/浅色换肤（study/spell/announce-admin 补接）

**工程质量**：补齐 eslint/prettier 工具链，lint 69 问题清零，prettier 统一格式化 49 文件，清理 decks 死代码

**测试**：203→220（tts +6、getAccentPreference +5、系统信息封装 +6）

---

*详细更新记录见 `English-mini-app/CLAUDE.md`*
