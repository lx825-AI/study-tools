# Math Formula Reference

React + TypeScript + Vite 数学公式速查 SPA。KaTeX 渲染，PWA 离线支持。

## 项目结构

```
src/
  data/
    types.ts           -- TypeScript 类型定义（Section, Formula, Subject, Level）
    formulas.ts        -- ~123 条公式，4 学科 22 章节
  components/
    App.tsx            -- 根组件，状态聚合 + 布局编排
    Sidebar.tsx        -- 左侧导航（章节树 + 工具栏）
    SearchBar.tsx      -- 搜索输入（防抖 + 历史下拉）
    SearchFilters.tsx  -- 学科/难度筛选
    FormulaGrid.tsx    -- 章节内公式卡片网格
    FormulaCard.tsx    -- 单条公式卡片（KaTeX + 折叠动画）
    ThemeToggle.tsx    -- 主题切换（自动/暗/亮）
    BackToTop.tsx      -- 回到顶部
    MobileSidebarToggle.tsx -- 移动端侧边栏开关
    OfflineBanner.tsx  -- 离线横幅
    Toast.tsx          -- Toast 通知（Provider + useToast hook）
  hooks/
    useTheme.ts        -- 主题管理（CSS 类切换、localStorage 持久化）
    useSearch.ts       -- 搜索（300ms 防抖、筛选、排序）
    useSearchHistory.ts -- 搜索历史（localStorage，上限 10）
    useFavorites.ts    -- 收藏（Set<string>，localStorage）
    useRecent.ts       -- 最近浏览（上限 20，localStorage）
    useProgress.ts     -- 章节学习进度追踪
    useHashRoute.ts    -- URL hash 路由
    useKeyboardShortcuts.ts -- 键盘快捷键
    useOnlineStatus.ts -- 在线/离线检测
  utils/
    katex.ts           -- LaTeX → HTML 渲染封装
    highlight.ts       -- 搜索高亮
    storage.ts         -- localStorage 读写 + JSON 损坏降级
  styles/              -- 6 个 CSS 文件（variables/global/sidebar/search/formula-card/responsive）
  __tests__/           -- 7 个测试文件（Vitest + Testing Library + jsdom）
```

## 关键约定

- **状态管理**：无全局状态库。App 组件聚合所有状态，通过 props 下发
- **持久化**：全部 localStorage（favorites/recent/search-history/progress/theme）
- **路由**：基于 URL hash（`#calc-limit`、`#__favorites__`、`#__recent__`）
- **构建**：`npm run build` → `dist/`，base 为 `'./'`（适配 GitHub Pages）

## 命令

```
npm install     -- 安装依赖
npm run dev     -- Vite 开发服务器
npm test        -- Vitest（48 tests, 6 files）
npm run build   -- tsc + vite build → dist/
```
