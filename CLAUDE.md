# study-tools monorepo

英语词汇学习 + 数学公式速查的学习工具仓库，三个独立子项目。

## 项目结构

```
English-web/    -- 英语词汇闪卡 PWA（纯 JS，零运行时依赖，esbuild 构建）
  js/       -- 14 个 JS 模块（app/state/models/utils/ebbinghaus/ui/panels/storage/schema）
  css/      -- 10 个 CSS 文件
  data/     -- 扩展词格式校验与迁移
  wordbooks/-- 5 套内置词书（JS 格式，script 动态加载）
  scripts/  -- esbuild 构建脚本

english-app/-- 英语背单词 uni-app（Vue 3 + Vite → 微信小程序 MVP）
  src/
    pages/       -- 9 个页面（index/study/complete/decks/preview/cards/stats/mine/onboarding）
    components/  -- 9 个组件（FlashCard/SpellInput/ProgressRing/StudyModeSelector/DeckCard/
                   PosterCanvas/EmojiRating/HeatmapChart/ForgettingCurve）
    utils/       -- 5 个工具（ebbinghaus/models/helpers/word-schema/white-noise）
    api/         -- 3 个封装（cloud/tts/auth）
    store/       -- 学习状态管理（Pinia-free reactive store）
    wordbooks/   -- 5 套词书（ES Module 格式，共约 22,000 词）
  cloudfunctions/ -- 7 个云函数（login/getDecks/importWordbook/saveProgress/
                    aiDiary/getStats/submitFeedback）
  static/        -- 图标/音频/图片资源

math-web/       -- 数学公式速查 PWA（React + TypeScript + Vite）
```

## 构建与测试

- English-web: `cd English-web && npm run build && npm test && npm run dev`
- english-app: `cd english-app && npm run build:mp-weixin`（构建）/ `npm run dev:mp-weixin`（开发）
- Math-web: `cd math-web && npm install && npm test && npm run build`
- 全量测试: 根目录 `npm run test:all`

## english-app 技术栈

| 层 | 技术 |
|----|------|
| 跨端框架 | uni-app (Vue 3 Composition API + Vite) |
| 后端 | 微信云开发（云数据库 + 云函数 + 云存储） |
| AI | DeepSeek API（aiDiary 云函数，含三层降级） |
| 算法 | SM-2 + 艾宾浩斯遗忘曲线（从 English-web/ 迁移） |
| 状态管理 | Vue reactive() 单例 store（无 Pinia 依赖） |
| 样式 | SCSS + 暗色主题 CSS 变量系统 |

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- english-app: 微信小程序（mp.weixin.qq.com 审核上架，appid 待填入 manifest.json）
- 使用 GitHub Pages + GitHub Actions 自动部署
