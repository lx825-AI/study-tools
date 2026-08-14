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
| English-mini-app | `npm run build:mp-weixin` | 203 用例（Vitest） |
| Math-web | `npm run build` | `npm test` |
| math-mini-app | `npm run build:mp-weixin` | 45 用例 |

全量：`npm run test:all`

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- English-mini-app: 微信小程序（appid 已配置，待审核）
- math-mini-app: 微信小程序（appid 待配置）
- GitHub Pages + Actions 自动部署

## 最近更新（2026-08-14）— English-mini-app v2.5

**词书云存储**：20 套词书 JSON 上传云存储（自动化上传脚本）+ getWordbook 分页读取验证通过

**管理员加固**：客户端硬编码令牌移除，校验改走云端（OPENID 白名单 + 口令）；修复环境变量未配置时鉴权绕过的越权漏洞

**代码清理**：删除 2 个零引用组件 + 4 个孤儿云函数（云函数 16→12）

**测试**：189→203（admin +10、wordbooks +4）

---

*详细更新记录见 `English-mini-app/CLAUDE.md`*
