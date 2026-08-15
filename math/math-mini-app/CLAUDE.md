# math-mini-app 数学公式速查微信小程序

uni-app + Vue 3 + TypeScript + Pinia + 微信云开发。math-web PWA 的小程序移植版，
自研 LaTeX→Canvas 公式渲染引擎，本地优先 + 云端增量同步。

## 项目结构

```
src/
  pages/          -- 4 个 Tab 页：index（首页）/ search（搜索）/ favorites（收藏）/ profile（我的）
  sub-browse/     -- 浏览分包：sections（章节列表）/ formulas（公式列表）/ detail（详情+笔记）/ recent（最近浏览）
  sub-practice/   -- 练习分包：quiz（测验）/ daily（每日挑战）/ result（成绩与错题本）
  components/     -- 9 个组件：FormulaCanvas（核心）/ FormulaCard / McqQuestion / FlashcardQuestion /
                     QuizResult / SearchBar / FilterPanel / EmptyState / ProgressBar / SubjectIcon
  composables/    -- 模块单例组合式函数（跨页面共享状态）：
                     useSearch / useFavorites / useRecent / useProgress / useNotes / useSearchHistory /
                     useTheme / useOnlineStatus / usePractice / useDailyChallenge / usePageQuery
  stores/         -- Pinia：formulas（公式数据+扁平索引）/ user（登录态）/ preferences（主题+字号）
  services/       -- cloud.ts（云函数封装，#ifdef MP-WEIXIN 守卫）/
                     sync.ts（DataSyncer：离线队列+300ms防抖+增量合并）/ auth.ts（静默登录）
  utils/formula/  -- 自研渲染引擎：tokenizer → parser → glyphs → metrics → layout → renderer
  utils/          -- storage（uni.storage 封装）/ cache（LRU）/ keys（{grade}:{sid}:{index} 键格式）
  data/           -- formulas-university.ts（177 条，从 math-web 零改动迁移）/ subjects.ts（学科元数据）
cloudfunctions/   -- login / syncData / getStats / feedback（构建时自动拷入 dist）
tests/            -- 5 文件 45 用例：data / formula-engine / composables / search / sync
scripts/          -- gen-icons.mjs（tabBar 图标生成：Node zlib 手写 PNG，零依赖）
math-miniapp-proposal.html -- 完整开发方案文档
```

## 命令

```
npm install             -- 安装依赖
npm test                -- Vitest（45 tests, 5 files）
npm run type-check      -- vue-tsc 类型检查
npm run dev:h5          -- H5 开发服务器（localhost:5173，可浏览器预览）
npm run dev:mp-weixin   -- 小程序开发构建（→ dist/dev/mp-weixin）
npm run build:mp-weixin -- 小程序生产构建（→ dist/build/mp-weixin，自动同步 cloudfunctions）
npm run gen-icons       -- 重新生成 tabBar 图标
```

## 关键约定

- **渲染引擎**：Canvas 2D 三阶段管线；Box 模型 `{w, h, d}`（h=基线上方，d=基线下方）；
  共享 LRU 缓存 200 条布局；渲染失败降级为 LaTeX 纯文本（FormulaCanvas 内置兜底）
- **存储 key**：公式定位 `{grade}:{sectionId}:{index}`（grade 恒为 university，V2 多学段预埋）；
  云端文档 `_id = {openid}_{业务key}`，删除用墓碑标记（deleted: true）传播
- **同步**：composable 自有存储为 UI 唯一数据源；syncer 只管操作队列与增量拉取，
  远端变更通过 subscribe 监听器合并（收藏/进度并集，笔记 LWW）
- **页面参数**：一律用 `usePageQuery()`（onLoad + onShow 解析 location.hash），
  不要用裸 onLoad——H5 同路由不同参数导航时组件复用会导致参数过期
- **H5 Canvas**：uni-canvas 内部 `<canvas>` 异步创建，FormulaCanvas 已内置 20 次重试
- **暗色主题**：CSS 变量 + 每页根 view `:class="{ dark: isDark }"`（小程序无法动态改 page 类）
- **代码风格**：单文件 ≤400 行，单函数 ≤50 行，单行 ≤120 字符

## 上线前待办（需在微信开发者工具操作）

1. `src/manifest.json` 与 `project.config.json` 填入 appid
2. `npm run dev:mp-weixin`，微信开发者工具导入 `dist/dev/mp-weixin/`
3. 开通云开发，部署 4 个云函数，创建 6 个集合（users/favorites/notes/progress/quiz_records/daily_challenges）
4. 集合安全规则：`{"read": "doc.userId == auth.openid", "write": "doc.userId == auth.openid"}`
5. 真机测试 → 提审（类目：教育 > 在线教育）
