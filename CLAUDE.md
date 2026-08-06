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

## 最近更新（2026-08-07）— English-mini-app v2.4

**公告系统**：独立公告管理页 + 悬浮按钮 + 最新公告弹窗优化

**管理员系统**：本地令牌鉴权 + 云函数 OPENID 后备，无需配置环境变量

**代码审查**：17 项公告/反馈模块问题全部修复

**云函数**：输入校验、OPENID 统一后备、login 日志打印

---

*详细更新记录见 `English-mini-app/CLAUDE.md`*
