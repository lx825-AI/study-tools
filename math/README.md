# AI 数学公式速查表

高等数学、线性代数、离散数学、概率统计公式速查表，涵盖大学期末考试必备公式。

## 功能

- **22 个章节，约 123 条公式**，按学科分组
- **全文搜索**（300ms 防抖），支持科目/难度筛选
- **收藏 + 最近浏览**，数据持久化到 localStorage
- **三种主题**：自动 / 暗色 / 亮色
- **网格/列表双视图**，支持打印
- **键盘快捷键**：`Ctrl+K` 搜索、`Alt+F` 收藏、`Alt+G` 切换视图、`Alt+T` 主题、`Alt+R` 随机
- **PWA** 离线可用，Service Worker 缓存
- **无障碍**：aria 属性、键盘操作、屏幕阅读器友好

## 技术栈

React 18 · TypeScript · Vite 6 · KaTeX · Vitest

## 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建
npm test         # 运行测试
```

## 部署

推送 `master` 分支自动通过 GitHub Actions 部署到 GitHub Pages。

在线地址: **[lx825-ai.github.io/math-reference](https://lx825-ai.github.io/math-reference/)**
