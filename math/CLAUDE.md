# Math Formula Reference

React + TypeScript + Vite 数学公式速查 SPA。KaTeX 渲染，PWA 离线支持。

## 项目结构

```
src/
  data/
    types.ts           -- TypeScript 类型定义（Section, Formula, Subject, Level）
    formulas.ts        -- ~140 条公式，5 学科（高等数学/线性代数/离散数学/概率统计/数值分析）
  components/
    App.tsx            -- 根组件，状态聚合 + 布局编排
    Sidebar.tsx        -- 左侧导航（章节树 + 工具栏；移动端开关状态由父组件控制）
    SearchBar.tsx      -- 搜索输入（防抖 + 历史下拉 + 搜索建议）
    SearchFilters.tsx  -- 学科/难度筛选（levelFilter 不过滤无 level 标签的公式）
    FormulaGrid.tsx    -- 章节内公式卡片网格
    FormulaCard.tsx    -- 单条公式卡片（KaTeX + 折叠动画 + 笔记 + 多格式复制 + 图片导出）
    PracticePanel.tsx  -- 公式测验（设置/选择/闪卡/结果；每日挑战集成）
    ThemeToggle.tsx    -- 主题切换（自动/暗/亮）
    BackToTop.tsx      -- 回到顶部
    MobileSidebarToggle.tsx -- 移动端侧边栏开关（纯展示）
    MobileTabBar.tsx   -- 移动端底部 Tab 栏
    OfflineBanner.tsx  -- 离线横幅
    Toast.tsx          -- Toast 通知（Provider + useToast hook，带卸载安全清理）
  hooks/
    useTheme.ts        -- 主题管理（CSS 类切换、localStorage 持久化）
    useSearch.ts       -- 搜索（300ms 防抖、筛选、排序）
    useSearchHistory.ts -- 搜索历史（localStorage，上限 10）
    useFavorites.ts    -- 收藏（Set<string>，localStorage）
    useRecent.ts       -- 最近浏览（上限 20，localStorage）
    useProgress.ts     -- 章节学习进度追踪
    usePractice.ts     -- 测验状态机（题库构建、MCQ/闪卡、错题记录、每日挑战）
    useDailyChallenge.ts -- 每日挑战（连续天数、完成状态、成就 emoji）
    useHashRoute.ts    -- URL hash 路由
    useKeyboardShortcuts.ts -- 键盘快捷键
    useOnlineStatus.ts -- 在线/离线检测
    useFormulaNotes.ts -- 公式个人笔记（localStorage）
  utils/
    katex.ts           -- LaTeX → HTML 渲染封装（KatexDisplay 声明式组件 + 缓存）
    highlight.ts       -- 搜索高亮
    storage.ts         -- localStorage 读写 + JSON 损坏降级
    formulaImage.ts    -- 公式导出为 PNG 图片（SVG + Canvas，内联 KaTeX CSS）
  styles/              -- 7 个 CSS 文件（variables/global/sidebar/search/formula-card/practice/responsive）
  __tests__/           -- 6 个测试文件，48 个测试（Vitest + Testing Library + jsdom）
```

## 关键约定

- **状态管理**：无全局状态库。App 组件聚合所有状态，通过 props 下发
- **持久化**：全部 localStorage（favorites/recent/search-history/progress/theme/notes/challenge/scores/mistakes）
- **路由**：基于 URL hash（`#calc-limit`、`#__favorites__`、`#__recent__`、`#__practice__`）
- **构建**：`npm run build` → `dist/`，base 为 `'./'`（适配 GitHub Pages）
- **代码风格**：单文件≤400行，单函数≤50行，单行≤120字符；测试覆盖核心逻辑

## 命令

```
npm install     -- 安装依赖
npm run dev     -- Vite 开发服务器
npm test        -- Vitest（48 tests, 6 files）
npm run build   -- tsc --noEmit + vite build → dist/
```
