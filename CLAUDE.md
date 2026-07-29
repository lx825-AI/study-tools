# study-tools monorepo

英语词汇学习 + 数学公式速查的学习工具仓库，四个独立子项目。

## 项目结构

```
English-web/    -- 英语词汇闪卡 PWA（纯 JS，零运行时依赖，esbuild 构建）
  js/       -- 14 个 JS 模块（app/state/models/utils/ebbinghaus/ui/panels/storage/schema）
  css/      -- 10 个 CSS 文件
  data/     -- 扩展词格式校验与迁移
  wordbooks/-- 5 套内置词书（JS 格式，script 动态加载）
  scripts/  -- esbuild 构建脚本

English-mini-app/  -- 英语背单词 uni-app（Vue 3 + Vite → 微信小程序，已提交审核）
  src/
    pages/       -- 12 个页面（index/study/complete/decks/preview/cards/stats/mine/
                   wrong-words/feedback-admin/announcements/privacy/spell）
    components/  -- 9 个组件（StudyCard/SpellInput/ProgressRing/DeckCard/
                   PosterCanvas/HeatmapChart/ForgettingCurve/AnnouncementModal）
    composables/ -- 2 个（useSettings/useFeedback）
    utils/       -- 12 个工具（ebbinghaus/helpers/models/storage/word-schema/useTheme/
                   wordbook-loader/session-persistence/daily-quote/data-io/logger/card-factory）
    api/         -- 4 个封装（cloud/tts/auth/dictionary）
    store/       -- 学习状态管理（reactive 单例）
  cloudfunctions/ -- 16 个云函数（login/checkAdmin/deleteUser/getDecks/importWordbook/
                    getWordbook/saveProgress/getStats/submitFeedback/getFeedback/deleteFeedback/
                    getAnnouncement/postAnnouncement/listAnnouncements/deleteAnnouncement）
  tests/         -- 5 个测试文件 98 用例（Vitest 3.x）
  wordbooks-cloud/-- 6 套词书 JSON
  static/        -- 图标资源

math-web/       -- 数学公式速查 PWA（React + TypeScript + Vite，KaTeX 渲染）

math-mini-app/  -- 数学公式速查微信小程序（uni-app + Vue 3 + TS + Pinia + 微信云开发）
  src/
    pages/       -- 4 个 Tab 页（index/search/favorites/profile）
    sub-browse/  -- 浏览分包 4 页（sections/formulas/detail/recent）
    sub-practice/-- 练习分包 3 页（quiz/daily/result）
    components/  -- 9 个组件（FormulaCanvas/FormulaCard/McqQuestion/FlashcardQuestion/
                   QuizResult/SearchBar/FilterPanel/EmptyState/ProgressBar/SubjectIcon）
    composables/ -- 10 个组合式函数（从 math-web/hooks 移植 + usePageQuery）
    stores/      -- 3 个 Pinia store（formulas/user/preferences）
    services/    -- cloud（云函数封装）/ sync（DataSyncer 同步引擎）/ auth（静默登录）
    utils/formula/ -- 自研 LaTeX→Canvas 渲染引擎（tokenizer/parser/glyphs/metrics/layout/renderer）
    data/        -- 177 条公式（formulas-university.ts，从 math-web 零改动迁移）
  cloudfunctions/ -- 4 个云函数（login/syncData/getStats/feedback）
  tests/         -- 5 个测试文件 45 用例（数据/渲染引擎/composables/搜索/同步引擎）
  scripts/       -- gen-icons.mjs（tabBar 图标生成，Node zlib 手写 PNG）
  math-miniapp-proposal.html -- 完整开发方案（8 周 4 里程碑）
```

## 构建与测试

- English-web: `cd English-web && npm run build && npm test && npm run dev`
- English-mini-app: `cd English-mini-app && npm test && npm run build:mp-weixin`
- Math-web: `cd math-web && npm install && npm test && npm run build`
- math-mini-app: `cd math-mini-app && npm test`（45 用例）/ `npm run build:mp-weixin`（构建，自动同步云函数到 dist）/ `npm run dev:h5`（H5 预览）/ `npm run type-check`（vue-tsc）
- 全量测试: 根目录 `npm run test:all`

## English-mini-app 学习模式

### 深度模式 🧠
- 答错重试（最多3次）
- 连续答对2次才推进阶段
- 间隔重试队列
- 适合学习新词、巩固记忆

### 快速模式 ⚡
- 包含新词和学习中的词（排除已掌握词 stage≥7）
- 不更新艾宾浩斯进度
- 不重试
- 适合碎片时间快速复习

### 复习模式 🔁
- 紧急度评分算法（逾期权重 + 阶段权重 + 难度权重 + 历史权重）
- 优先复习严重逾期词
- 正常更新进度

### 艾宾浩斯算法
- 智能失败回退（首次失败回退1级，连续失败≥2次回到stage 1）
- 逾期遗忘惩罚（逾期>7天额外降级）
- 自适应间隔调整（根据easeFactor微调）
- 回答质量四档（correct/fuzzy/hesitate/wrong）

## math-mini-app 技术栈

| 层 | 技术 |
|----|------|
| 跨端框架 | uni-app (Vue 3 Composition API + TypeScript + Vite 5) |
| 公式渲染 | 自研 LaTeX→Canvas 引擎（三阶段管线 + LRU 缓存，177 条公式 100% 可渲染，失败降级纯文本） |
| 后端 | 微信云开发（云数据库 6 集合 + 4 云函数） |
| 同步策略 | 本地优先 + 离线队列（≤200）+ 300ms 防抖批量 flush + 增量拉取（updatedAt） |
| 状态管理 | Pinia（3 store）+ composable 模块单例 |
| 主题 | CSS 变量 + 每页根 view 动态 dark class |

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- English-mini-app: 微信小程序（appid 已配置 project.config.json，待备案上架）
- math-mini-app: 微信小程序（appid 待填入 manifest.json / project.config.json）
- 使用 GitHub Pages + GitHub Actions 自动部署

## 最近更新（2026-07-27）— English-mini-app v2.1

### 会话持久化
- 学习中途退出保存会话快照，下次进入弹窗恢复（2 小时有效）
- 深度模式完成后自动跳转完成页
- 恢复会话时模式从 storage 实时读取

### 模式切换优化
- 首页新增 🧠深度 / ⚡快速 分段切换按钮，点击弹出确认对话框
- 首页和学习页均显示当前模式行为描述
- 管理员按钮添加权限控制（v-if="isAdmin"）

### 快速模式改进
- 答对 stage 0→1 并写回卡片，避免下次重复同一批词

### 代码审查修复（15 项）
- 2 CRITICAL + 7 HIGH + 6 MEDIUM，详见 English-mini-app/CLAUDE.md

## 最近更新（2026-07-28）— English-mini-app v2.2

### 工程化建设
- ESLint + Prettier 配置就绪
- 新增 4 个测试文件，测试增至 180 用例（+82）
- 16 个云函数提取 common/ 共享模块，消除重复样板代码

### 安全修复
- deleteWordbooks/checkAdmin 硬编码 ADMIN_OPENID 改为环境变量
- deleteWordbooks/getWordbook 硬编码云环境 ID 改为动态获取

### UI 优化
- study.vue 完成流程简化：删除庆祝页，学完直接跳转完成页，redirectTo 消除返回空白
- complete.vue 重构：固定页面布局，单词回顾 ≤10 词固定、>10 词滚动
- index.vue 提取 DailyQuote/ModeSwitch/DeckPicker 组件

### Bug 修复
- 深度模式完成页面单词数量 3 倍 bug（resultsLog 按 cardId 去重）
- 统计界面数量同步修正（cardsStudied/correct/wrong 改用去重计数）
- complete.vue 左右边距不一致 + 详情弹窗内容溢出修复

## 最近更新（2026-07-25）

### 学习界面优化
- 添加返回上一个单词按钮（卡片上方）
- 卡片正面显示三个评估按钮（不会/模糊/会了）
- 翻转后保持相同按钮布局
- 自动播放单词语音（每次切换卡片时）

### 学习算法优化
- 深度模式：动态队列间隔重复，答对推进，答错重试
- 快速模式：线性浏览，最小阶段推进（答对 stage 0→1）
- 复习模式：紧急度评分排序
- 艾宾浩斯：智能回退、逾期惩罚、自适应间隔

### UI 优化
- 卡片高度缩小（420px → 350px）
- 拼写功能改为独立页面
- 学习完成页面单词详情预览
- 复习统计信息增强
