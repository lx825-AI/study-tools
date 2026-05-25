# study-tools monorepo

英语词汇学习 + 数学公式速查的学习工具仓库，两个独立子项目。

## 项目结构

```
English/    -- 英语词汇闪卡 PWA（纯 JS，零依赖，esbuild 构建）
math/       -- 数学公式速查 PWA（React + TypeScript + Vite）
```

## 构建命令

- English: `cd English && npm run build` → `npm run dev` 本地预览
- Math: `cd math && npm install && npm test && npm run build`

## 部署

Math 项目使用 GitHub Pages 部署 (https://lx825-ai.github.io/study-tools/)。English 项目暂未部署。
