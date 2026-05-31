# study-tools monorepo

英语词汇学习 + 数学公式速查的学习工具仓库，两个独立子项目。

## 项目结构

```
English/    -- 英语词汇闪卡 PWA（纯 JS，零运行时依赖，esbuild 构建）
  js/       -- 14 个 JS 模块（app/state/models/utils/ebbinghaus/ui/panels/storage/schema）
  css/      -- 10 个 CSS 文件
  data/     -- 扩展词格式校验与迁移
  wordbooks/-- 5 套内置词书（JS 格式，script 动态加载）
  scripts/  -- esbuild 构建脚本
math/       -- 数学公式速查 PWA（React + TypeScript + Vite）
```

## 构建与测试

- English: `cd English && npm run build && npm test && npm run dev`
- Math: `cd math && npm install && npm test && npm run build`
- 全量测试: 根目录 `npm run test:all`

## 部署

- English: https://lx825-ai.github.io/study-tools/english/
- Math: https://lx825-ai.github.io/study-tools/math/
- 使用 GitHub Pages + GitHub Actions 自动部署
