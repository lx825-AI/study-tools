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
| English-mini-app | `npm run build:mp-weixin` | 304 用例（Vitest） |
| Math-web | `npm run build` | `npm test` |
| math-mini-app | `npm run build:mp-weixin` | 45 用例 |

全量：`npm run test:all`

## 部署

- English-web: https://lx825-ai.github.io/study-tools/english/
- Math-web: https://lx825-ai.github.io/study-tools/math/
- English-mini-app: 微信小程序（appid 已配置，待审核）
- math-mini-app: 微信小程序（appid 待配置）
- GitHub Pages + Actions 自动部署

## 最近更新（2026-08-21）— English-mini-app 学习模式入口重构

**学习新词恒为深度模式**：删除首页 ModeSwitch 切换组件，「学习新词」固定深度；**快速浏览独立入口**：DeckCard 底部新增「📖 学习 | ⚡ 快速」操作行（对齐 English-web 模式卡并列做法）；per-deck learnMode 旧数据全链路删除（含预览页模式徽章、deprecated 全局 key）；错词本练习补写 deep 分流（修存量残留 quick bug）

**审查修复（同日 5 项）**：跨词书会话恢复丢进度（快照加 deckId + shouldRestoreSession 守卫）；chip 长按误触删除菜单（@longpress.stop）；快速日志并入统计页与数据备份（stats 合并 quick_logs + data-io 导出导入补 quick 数据）；complete 页 studyAgain 回写模式 key；测试 280→286

**操作行精简（同日）**：词书卡删除「学习」入口，只保留通栏「⚡ 快速浏览」+ 常驻说明小字「线性过词 · 不修改学习进度 · 适合碎片时间」（深度学习从首页进入）；decks 页 startDeckStudy 删除

**首页双 📢 修复（同日）**：删除首页管理员 📢 按钮（管理入口统一到「我的」页公告管理），消除与公告 FAB 的右上角双喇叭重叠

**默认英式 + 卡片切换按钮（同日，对齐 web）**：发音默认 'us'→'uk'（6 处写入/回退点 + login 云函数）；StudyCard 正面拆出 🇬🇧/🇺🇸 切换按钮（写全局偏好 + 停旧播放 + toast，不立即重读）；新增 toggleAccentPreference 独立导出；测试 286→288

**审查修复（同日 4 项）**：stopSpeak 补 _playSeq++（修切换口音后旧口音 600ms 重试复播）；mine 页 onShow 刷新设置（修显示陈旧）；tts/组件默认参数统一 uk；测试意图修正

**stop audio fail 修复（同日）**：tts 对无 src 的新音频实例跳过 stop()（修 wxapplib「operateAudio:fail:stop audio fail」异步报错）；测试 288→291

**stop audio fail 修复 II（次日）**：stop 守卫升级为播放态 `_isPlaying`（修自然结束复用/失败重试路径的残留报错）；测试 291→294

## 最近更新（2026-08-22）— English-mini-app 拼写入口改右滑手势

删除「✏️ 拼写」按钮，改为卡片右滑进入拼写（深度/快速/复习全模式生效）；新增 isSwipeRight 纯函数判定手势（60px 阈值 + 横向为主）；卡片常驻提示「点击翻转 · 右滑进入拼写」；测试 294→298

**拼写页左滑退出（同日）**：spell 页左滑手势退出（isSwipeLeft 镜像复用 isSwipeRight），底部常驻提示「← 左滑退出拼写」；测试 298→302

**拼写模式性能优化（同日）**：打字去每键 value 回写（受控 input 原生往返是卡顿主因）+ 聚焦延后 350ms 错峰入场转场 + 退出先收键盘再导航 + pauseSpeak 软暂停复用音频实例 + 光标 v-show；测试 302→304

**左滑退出修复（同日）**：拼写正确后键盘弹出吞掉 touchend 致左滑失效——改为 touchmove 越阈值即触发 + touchend 兜底 + navigateBack 失败重置 backLock

**拼写模式全链路审查修复（同日，8 项）**：tts 超时看门狗模块级化（旧局部 timer 连续播放时误 destroy 复用实例）；StudyCard suppressClick 每手势重置（微信不补发 click 残留吞翻卡）；SpellInput 判定守卫 !idle（「完成」键+定时器双入口防二次朗读）；study.vue 自动发音 4 处收敛 scheduleAutoSpeak（initStudy/goPrevCard 裸 setTimeout 未登记致拼写页残留发声）；删 SpellInput 死 prop word、study.vue 死样式；spell.vue 删历史 storage 清理 + decodeURIComponent try/catch；空词 letterCount 守卫；测试 304→307

**删除学习提醒功能（次日）**：mine 页学习提醒设置行 + 时间选择器弹窗 + useSettings 提醒状态 + 首页 checkReminder 每日 toast 全链路删除；首页「复习提醒」弹窗（到期复习卡）保留；测试 307→303

## 最近更新（2026-08-23）— English-mini-app 错词本/生词本审查修复

**⭐ 收藏持久化修复（HIGH）**：学习页点 ⭐ 后直接退出收藏静默丢失（toggleHard 只改内存 + saveProgress 仅落盘答题卡 + 零答题提前 return）——persistProcessedCards 幂等合并落盘 + 800ms debounce + onUnmounted flush；**本周新增口径修复（MED）**：周起点改周一 UTC 口径 + 首次错误计 1（周日当天整周错误全消失 bug）；**旧格式 definitions 展示守卫（MED）**：wordbook 崩页/wrong-words 首字符/study 逐字符渲染三处接入 safeDefinitionLines；另修 batchPractice 队列超限静默失败、wordbook listHeight 溢出、storage 旧数据数组守卫；测试 303→318

## 最近更新（2026-08-23）— English-mini-app 统计界面审查修复

**周报告桶错位一天（MED）**：本地午夜+toISOString 与 UTC 日志 key 混用致周一学的词显示在周二柱——getWeekDates 纯函数统一 UTC 口径；**日志合并口径（MED-LOW）**：同日快速+深度求和对齐首页 todayProgress（原深度覆盖快速只计其一）；**热力图 UTC 化（MED-LOW）**：上午 0-8 点全网格错位 + 未来格淡色区分；另修周趋势下降色不生效、stage 负值/NaN 钳制、死代码清理；测试 318→328

**预览页删除搜索栏（同日，迁移第一步）**：preview 页单词搜索栏全链路删除（迁移至词书管理页跨词书搜索的第二步待做）；测试 328 不变

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

**判定反馈 3 项优化**：正确后字母保留槽位+绿色边框（修改字母即清除陈旧 ✅）；错误后答案 600ms 随清空一起消失（防照着拼写）；判定反馈移入卡片内部拼写格子正下方；测试 199→201；Playwright 端到端 12/12 通过

## 最近更新（2026-08-21）— English-web 拼写单隐藏输入框方案 + tts 韧性

**方案对齐小程序**：弃多 input 格子框，改下划线展示位 + 单隐藏输入框（键盘只弹一次、闪烁光标、错位红显+下划线答案行 2000ms 揭示、满词 150ms 自动判定）；纯函数移植 parseWordSlots/lettersOnly/rebuildSlotLetters/firstEmptySlotIndex；tts 失败 600ms 重试一次 + 播放序号防旧重试打断

**附带修复**：getOverdueDays 统一 UTC（修复本地 00:00-08:00 窗口今日到期误判逾期）；测试 201→219；Playwright 端到端 24/24 + tts 5/5 通过

## 最近更新（2026-08-20）— English-mini-app 拼写模式槽位输入 + 纯练习

**槽位式输入**：SpellInput 删除下方输入框，改为上方下划线 `_ _ _` 展示位 + 单隐藏输入框（真机验证多 input 逐槽焦点切换键盘往复，弃用格子框）——键盘只弹一次、事件值全量重建、追加输入+退格撤回、输满自动判定、撇号/连字符固定展示、判定剥除非字母归一化 dont 判对；parseWordSlots/lettersOnly/rebuildSlotLetters 纯函数

**纯练习化（对齐 English-web）**：✅ 音标+朗读、字母保留槽位；❌ 上方错位红显指错、下方下划线样式展示完整正确答案（无光标），2000ms 后自动清空盲拼重试（防照着拼写）；不推进队列/不改遗忘曲线/不写日志；spell:result 事件链路与结果区按钮全删除；修复 visible watch immediate 首屏自动发音

**发音韧性**：tts 播放失败自动重试一次（有道 dictvoice 偶发 503 限流）+ study 页 speak 补 .catch

**流畅度优化**：tts 音频上下文单例复用、自动发音错峰 800ms、输入热路径跳过无效 setData、槽位样式预计算

**退格撤回修复**：单输入框退格天然撤回（值变短重建）、中文 commit 不误删；rebuildSlotLetters 纯函数（替代 applySlotInput）

**光标提示**：当前输入位下划线上方闪烁竖线（仅光标闪动，firstEmptySlotIndex 纯函数）

**测试**：279

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
