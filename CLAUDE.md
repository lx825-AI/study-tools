# study-tools monorepo

英语词汇学习 + 数学公式速查工具仓库，四个独立子项目。

## 项目结构

```
english/
  English-web/       -- 英语闪卡 PWA（纯 JS，esbuild）
  English-mini-app/  -- 英语背单词 uni-app（Vue 3 + 微信云开发）→ 详见子目录 CLAUDE.md
math/
  math-web/          -- 数学公式 PWA（React + TS + Vite + KaTeX）
  math-mini-app/     -- 数学公式小程序（uni-app + Vue 3 + TS + Pinia）
```

## 构建与测试

| 项目 | 构建 | 测试 |
|------|------|------|
| English-web | `npm run build` | `npm test` |
| English-mini-app | `npm run build:mp-weixin` | 220 用例（Vitest） |
| Math-web | `npm run build` | `npm test` |
| math-mini-app | `npm run build:mp-weixin` | 45 用例 |

全量：`npm run test:all`

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- English-mini-app: 微信小程序（appid 已配置，待审核）
- math-mini-app: 微信小程序（appid 待配置）
- GitHub Pages + Actions 自动部署

## 最近更新（2026-08-16）— English-mini-app v2.5

**卡片编辑表单扩展**：cards 页编辑弹窗新增词组短语/同义词/反义词/易混淆词 4 个编辑框，解析逻辑抽 card-form.js 纯函数模块；startEdit 对旧格式数据（字符串 definitions/例句元素）防崩溃防脏数据

**每日目标滚轮**：新增 GoalWheel 组件（纯 view + touch 手势 + transform 自绘：40px 大数字、主题深浅色自适应、渐隐遮罩、松手吸附最近档）；mine 设置弹窗 + decks 导入弹窗接入；导入页与引导页选项统一最高 100 词/天；默认目标 30→10 全链路统一；滚轮历经原生 picker/picker-view/scroll-view 三版绕行后手势自绘定稿（含 9 项审查问题修复）

**清理**：删除 3 个零引用文件（DailyQuote.vue、utils/useTheme.js、session-persistence.js）；学习页移除卡片顺序计数器

**测试**：220→262（card-form +24、滚轮纯函数 +18）

## 最近更新（2026-08-20）— English-web 学习交互 4 项修复

**自动播放发音**：换卡 300ms 后自动朗读当前词（对齐小程序 speakCurrentCard）；`#panelStudy.visible` 门控防后台发声；`_speakTimer` 防叠加

**会了/不会直答**：删除 answerStudy 翻转守卫，按钮直接作答推进，翻转仅由点卡片触发

**拼写纯练习 + 盲拼**：拼写对/错均停留当前词可重拼/重试，不推进队列/不改遗忘曲线/不写日志；盲拼仅 🔒 占位 + 🔊 发音提示；拼写模式禁翻卡、隐藏作答按钮；toggleSpellMode 薄壳化 + renderStudyPanel 集中拼写 UI；spellAnswered 字段全删除

**测试**：175→187；Playwright 端到端 23/23 通过

**追加打磨**：盲拼提示改下划线遮罩（按单词字母数显示带间隔下划线，buildSpellBlindMask 纯函数）；回看态会了/不会按钮灰暗处理（disabled + opacity 0.35，对齐小程序 dimmed）；测试 187→192

**槽位式输入改造**：删除下方独立输入框+确认按钮，卡片正面下划线处逐格输入字母（buildSpellSlotHtml 槽位生成、输满自动判定、错误红框 600ms 清空重拼、撇号/连字符固定展示归一化判定）；测试 192→199；Playwright 端到端 15/15 通过

## 最近更新（2026-08-20）— English-mini-app 拼写模式盲拼下划线

**拼写页中文提示删除**：SpellInput 删除「根据释义拼写单词」+ 中文释义提示块，改为按单词字母数显示带间隔下划线（对齐 English-web 盲拼）；definition prop/ref/URL 参数孤立链路全删除；新增 buildSpellBlindMask 纯函数

**测试**：262→268（helpers +6）

## 最近更新（2026-08-19）— English-web 学习算法全量对齐 v2.8

**单轨化**：删除 SM-2 双轨（applySM2/nextReview/interval），applyEbbinghaus 重写为小程序等价实现——智能回退、逾期惩罚不叠加、EF 自适应间隔、逾期答对降级门控、防御性补齐（NaN/夹紧/历史截断）

**深度动态队列**：splice 重插（错+3/对+5/+10/+15）、出现≥3次或阶段≥4 移出、●●○ 计数点、回看按钮；**修复快速模式已学词被降级 bug**（答对仅 stage 0→1）；快速队列 stage<5+每日目标截断；复习紧急度排序+上限 50；统计会话汇总去重；TTL 2 小时

**测试**：123→163

**审查修复（2026-08-19）**：与小程序逐行比对修复 7 项——回看态守卫前移（防拼写绕过改写调度/污染统计）、quick 空卡崩溃守卫、exitReviewMode 残留会话清理、快照 elapsed 时长重锚（不计关闭空闲）、完成面板去重口径统一、恢复快照与牌组 id 交叉校验、已完成会话不重复覆盖日志；每日目标默认 20→10；测试 163→175

## 最近更新（2026-08-15）— English-web 反向对齐 v2.7

**删除 Web 独有功能（19 项）**：智能混合模式、运行时排序切换、全局搜索、键盘快捷键、移动端手势、彩带、牌组导出、外部词书导入、系统通知提醒、备份提醒+数据备份区、云同步（半成品死代码）、小程序引导条、卡片批量粘贴导入、演示数据、学习头部错题复习按钮、每日一句换一句按钮、新词数设置、预览隐藏释义、错词 CSV 导出——Web 与小程序功能严格对齐

**保留**：PWA 离线/安装、拼写模式、预览搜索、卡片批量删除、统计面板、分享、错词本练习/移出、快速模式、内置词书导入

**测试**：115→114

## 最近更新（2026-08-15）— English-web 功能对齐 v2.6

**词书统一**：新增 gen-wordbooks.js/wordbook-lib.js 生成脚本，Web 全部 10 套词书替换为小程序新数据（5 替换沿用旧 key + 新增初中/核心系列 5 本，共 28102 词，100% 音标）；SW 预缓存减为 2 本 + runtime 按需缓存；导入面板加词书来源声明

**快速浏览模式**：新增 quick-mode.js（对齐小程序语义：线性过词、stage 0→1、不写遗忘历史、独立 quick-log 日志）

**错词本 tab**：新增 wrong-words.js 面板（EF≤1.8 列表、批量练习、导出 CSV、移出）

**每日一句 + 分享**：新增 daily-quote.js（37 条名言与小程序同源）；分享学习成果按钮接线 shareAchievement

**测试**：99→115（wordbook-lib +7、quick-mode +5、wrong-words +5、daily-quote +3 等）；冒烟 12/12 + SW 离线 4/4 通过

---

## 最近更新（2026-08-14）— English-mini-app v2.6

**英式发音**：新增 `getAccentPreference()` 统一读取发音偏好，study/preview/spell 三处硬编码 'us' 全部接通，有道 dictvoice type=1 英式发音生效；tts.js 抽出 `buildTtsUrl` 纯函数

**审核前打磨**：submitFeedback/postAnnouncement 接入内容安全检测 msgSecCheck v2（违规拒绝入库）；废弃 API `getSystemInfoSync` 全量迁移；首页注册分享（`onShareAppMessage`）

**主题全覆盖**：16 页全部支持深/浅色换肤（study/spell/announce-admin 补接）

**工程质量**：补齐 eslint/prettier 工具链，lint 69 问题清零，prettier 统一格式化 49 文件，清理 decks 死代码

**测试**：203→220（tts +6、getAccentPreference +5、系统信息封装 +6）

---

*详细更新记录见 `english/English-mini-app/CLAUDE.md`*
