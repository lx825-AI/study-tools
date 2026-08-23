# English Flashcard PWA

SPA 英语词汇闪卡应用，使用艾宾浩斯遗忘曲线算法（v2.8 起单轨，SM-2 已删除）。纯 JavaScript，零运行时依赖。功能与微信小程序版（English-mini-app）对齐。

## 学习模式（v2.8 起与小程序行为完全一致）

- **📖 学习新词（深度模式）**：动态队列——每轮新词数跟随每日目标（默认 10，引导页可设 5-200）；答完 splice 移除后按阶段重插（答错 idx+3；答对 stage≤1→idx+5、stage2→idx+10、stage3→idx+15），出现≥3次或阶段≥4 永久移出（wordsCompleted+1）；计数点 ●●○；「← 上一个」回看
- **🔁 今日复习**：到期词按紧急度综合评分排序（逾期 10/20/35/50 + 阶段 5/10/15 + EF 5/10/15 + wrongCount 0/5/10），软上限 50
- **📋 错题强化**：集中攻克所有牌组中 EF≤1.8 且已学过的难词
- **⚡ 快速浏览**：队列仅 stage<5（新词→到期→逾期降序→阶段升序，截断到每日目标）；答对仅 stage 0→1（经 applyEbbinghaus：EF+0.1、reps+1、写一条历史；stage>0 答对原样保留）；答错 wrongCount++/wrongDates/_consecutiveFails++
- **⌨️ 拼写模式（纯练习）**：学习中内嵌；**下划线展示位 + 单隐藏输入框**（对齐小程序最新方案：移动端键盘只弹一次，纯 view 下划线格显示字母/`_` + 当前输入位闪烁竖线光标；隐藏框 native 值为真值源全量重建，退格天然撤回、中文 commit 不误删；点槽位区聚焦）；词间分组、连字符/撇号固定展示、判定两侧剥除非字母——"don't" 填 dont 判对；词形/音标/难度/计数点全隐藏，点卡片不翻转防泄漏背面释义；对/错均停留当前词——正确 ✅+音标+朗读、**字母保留**（绿色下划线，退格改字母回输入态清除陈旧 ✅）；错误 ❌ 拼写错误（不含答案）+ **错位红显指错 + 下方下划线样式答案行完整揭示，2000ms 后自动清空盲拼重试**（防照着拼写）；判定反馈位于卡片内部拼写格子正下方；**不推进队列、不改遗忘曲线、不写学习日志**；拼写期间隐藏会了/不会按钮，退出后恢复作答；纯函数 `parseWordSlots`/`lettersOnly`/`rebuildSlotLetters`/`firstEmptySlotIndex`（utils.js）、`_renderSpellSlots` 局部渲染（隐藏框在容器外不重建焦点不丢）、事件委托在 study-panel.js IIFE 顶层（document input/keydown/click/focusin/focusout）
- **🔊 发音韧性**：有道 audio 兜底播放失败 600ms 后自动重试一次（`_playAudioAttempt` + `_audioPlaySeq` 防旧请求重试打断新播放；toggleAccent 切口音失效旧重试），二次失败才 toast
- **回看态按钮灰暗**：点「← 上一个」回看后会了/不会按钮 disabled + opacity 0.35（对齐小程序 answer-buttons.dimmed），仅作查看不可重新作答
- **🔊 自动发音**：每次换卡 300ms 后自动朗读当前词（对齐小程序 speakCurrentCard）；仅学习面板可见时播放（防后台 renderAll 误发声）；`_speakTimer` 防重复渲染叠加播放
- **作答按钮**：会了/不会直接作答推进（无"未翻转先翻卡"守卫），翻转仅由点击卡片触发

## 学习算法（v2.8 单轨）

- **SM-2 已删除**：EF/repetitions 统一由 `applyEbbinghaus(card, passed, quality)` 维护；调度日期仅 `ebbinghausNextReview`（旧 nextReview/interval/difficulty 字段冻结保留，不再写入）
- 答对：stage++（quality==='correct'）、EF+0.1（封顶 3.5）、reps+1、间隔自适应 `round(interval×EF/2.5)` 下限 1、逾期>7天且 prevStage>1 降 1 级门控、history 带 quality
- 答错：智能回退（stage≤2 或连败≥2 → 1，否则退 1 级）+ 逾期惩罚（1-3天 0/4-7天 1/>7天 2）取 min 不叠加、EF-0.2（下限 1.3）、reps=0、_consecutiveFails++
- 会话恢复 TTL 2 小时；旧线性 new 快照恢复时 index 重置迁移
- 统计落库：会话完成时按卡去重汇总（当日覆盖语义），日志结构 `{date, cardsStudied, correct, wrong, duration, completedGoal}`；已掌握口径 = ebbinghausStage≥7

## 项目结构

```
index.html          -- SPA 入口（5 个 tab：牌组/学习/预览/卡片/统计）
js/
  app.js            -- init()、语音朗读、词书全量预加载、待复习 toast、PWA 安装横幅、离线提示
  state.js          -- 全局状态、getDeck/getCurrentDeck
  idb-storage.js    -- IndexedDB 主存储 + localStorage 降级备份（突破5MB限制，数据精简压缩）
  models.js         -- ID 生成、难度计算、词规范化
  utils.js          -- HTML 转义、CSV 解析、Levenshtein 模糊搜索、getCardFront/getCardBack 安全取值
  ebbinghaus.js     -- 艾宾浩斯遗忘曲线：8阶段复习调度、到期检测、逾期排序
  ui.js             -- 牌组选择渲染、面板切换（panelMap 含 wrong）、导航徽章、renderAll
  daily-quote.js    -- 每日英语名言（34 条，与小程序同源）、pickTodayQuote/getNextQuote/switchQuote/renderDailyQuote
  deck-panel.js     -- 牌组 CRUD（学习/编辑/删除）
  quick-mode.js     -- 快速浏览模式（startQuickMode/applyQuickResult/loadQuickLog）
  study-panel.js    -- 多模式学习 + 拼写模式（⌨️ 内嵌）+ 艾宾浩斯作答（单轨）+ 进度持久化
  wrong-words.js    -- 错词列表模块：学习模式引导页「错题强化」折叠区（collectFailedCards 复用、单卡移出）
  preview-panel.js  -- 表格预览（200+ 卡片虚拟滚动）、搜索、高亮
  cards-panel.js    -- 卡片列表（100+ 虚拟滚动）、批量选择与删除
  import.js         -- 内置词书注册表（10 本）、script 动态加载、词书来源声明、导入弹窗两级分类（级别×大纲/核心，对齐小程序）
  stats-panel.js    -- 统计面板编排（双列仪表盘：KPI 行/本周报告/总览/打卡日历/26周热力图/遗忘曲线/阶段分布/错题统计）
  stats-aggregate.js -- 统计纯聚合函数（mergeLogs/buildWeekSeries/buildCalendarData/buildHeatmapWeeks/stageDistribution/estimateUserCurve/curveNoteText/heatLevel）
  stats-curve.js    -- 遗忘曲线 Canvas 模块（renderCurveSectionHtml/drawStatsCurve/refreshStatsCharts）
data/
  word-schema.js    -- 扩展词格式校验与规范化、_ensureDefinitionsArray 数组保证、migrateCardsSchema 数据迁移
css/                -- 10 个 CSS 文件
  variables.css / base.css / components.css / deck.css
  study.css / mode.css / typing.css / preview.css / stats.css / stats-charts.css
wordbooks/          -- 10 套词书（JS 格式，注册到 window.__VOCAB_REGISTRY__，由 gen-wordbooks.js 生成）
scripts/
  build.js           -- esbuild 构建（CSS 合并、JS 打包、词书复制、HTML 组装）
  gen-wordbooks.js   -- 词书生成：读 English-mini-app/wordbooks-cloud/ 10 套 JSON → 紧凑 JS（npm run gen:wordbooks）
  wordbook-lib.js    -- 词书生成纯函数库（BOOK_CONFIG/compactWords/buildRegistrySource，供脚本与测试复用）
```

## 词书系统

20 套词书与小程序（English-mini-app）同源：`scripts/gen-wordbooks.js` 读取 `English-mini-app/wordbooks-cloud/` 的 20 个 JSON（10 乱序 + 10 正序 -sorted，两两同词仅排序不同）生成紧凑单行 JS（约 16MB）。乱序组：前 5 本替换旧词书（沿用旧 key/旧 name，已导入用户按 name 去重），后 5 本为新增；正序组 10 本为 2026-08-23 新增（name 带「（正序）」后缀，key 带 -sorted，对齐小程序）。导入第二屏为大纲/核心双节，每节渲染 🔀乱序版/🔤正序版 短标签书行（order 字段 + 静态 wordCount，免加载即可显示词数）；进入第二屏即后台预取该级别全部词书脚本（点击导入零等待）；已导入判定按 deck.source（词书 key）优先、旧牌组回退按 name。学习队列按模式组织：新词=词书原序（动态重插）、复习=紧急度降序、快速=新词/到期/逾期优先级、错题=EF 升序。SW 仅预缓存 2 本最常用（高中+四级），其余按需 runtime cache。BOOK_CONFIG、import.js 的 BUILTIN_WORDBOOKS、scripts/build.js 的 WORDBOOKS 三处清单需同步维护。

## 最近更新（2026-08-20）— 学习交互 4 项修复（对齐小程序）

**自动播放发音**：renderStudyPanel 末尾换卡 300ms 后自动朗读当前词（对齐小程序 speakCurrentCard）；仅 `#panelStudy.visible` 时播放（renderAll 后台渲染不发声）；`_speakTimer` 每次先清后设防叠加

**会了/不会直答**：删除 answerStudy「未翻转先翻卡并 return」守卫——按钮点击直接作答推进；翻转仅由点击卡片触发（对齐小程序 markAnswer）

**拼写纯练习 + 盲拼**（有意偏离小程序：按用户要求拼写不参与进度）：checkSpelling 重写为对/错均停留当前词（✅/❌ 反馈、输入清空可重拼/重试），不调 answerStudy → 零队列推进/零调度改写/零日志污染；盲拼正面仅 🔒 占位 + 发音提示（词形/音标/难度/计数点/阶段徽章全隐藏）；拼写模式禁止翻卡（app.js 守卫改按 spellMode 拦截，防泄漏背面释义）；拼写期间隐藏会了/不会按钮；toggleSpellMode 薄壳化（UI 集中于 renderStudyPanel 重建）；spellAnswered 字段及 8 处引用全删除；4 个 start 入口加 spellMode 防御重置

**测试**：175→187（自动播放 4、会了/不会直答 2、拼写纯练习 4、盲拼/toggle 2；setup.js 新增 window.mountStudyDOM 共享 DOM 桩）；Playwright 端到端 23/23 通过

**追加打磨（2026-08-20）**：盲拼提示改下划线遮罩——正面按单词字母数显示带间隔下划线（`buildSpellBlindMask` 纯函数：字母→`_`、按空白分组、连字符/撇号原样保留）+ 保留「听发音拼写」辅助文字；回看态会了/不会按钮灰暗处理（disabled + opacity 0.35，对齐小程序 dimmed，仅作查看不可重新作答）；测试 187→192；Playwright 端到端 10/10 通过

**槽位式输入改造（2026-08-20）**：删除下方独立输入框+确认按钮（index.html spellInputArea 整块删除、app.js 三处旧绑定删除、mode.css 旧 input 样式清理），改为卡片正面下划线处逐格输入字母——`buildSpellSlotHtml` 纯函数渲染单字符槽位（字母→input 槽连续编号、空白→gap 间隔、撇号/连字符→固定展示）；document 事件委托（input 过滤+自动跳格+末槽全满自动判定 / Backspace 空槽回退 / focusin 键盘避让，绑定于 study-panel.js IIFE 顶层因测试不加载 app.js）；checkSpelling 槽位化（守卫顺序不变，两侧剥除非字母归一化——dont 判对）；错误：槽位红框 shake+禁入，600ms 后清空重拼（App._spellWrongTimer 双清防跨卡残留）；toggleSpellMode 加回看守卫+聚焦首槽；测试 192→199；Playwright 端到端 15/15 通过

**判定反馈 3 项优化（2026-08-20，对齐小程序 SpellInput 纯练习化）**：正确后不清空重拼——字母保留槽位+绿色边框（spell-slot-correct），修改字母即回输入态清除陈旧 ✅（input 委托检测 spell-correct 态）；错误后答案不常驻——600ms 清空回调同时清空 feedback 文字（防照着拼写）；判定反馈从卡片下方移入卡片内部拼写格子正下方（盲拼分支动态渲染 #spellFeedback，index.html/setup.js 桩同步删除）；测试 199→201；Playwright 端到端 12/12 通过

## 最近更新（2026-08-23）— 导入界面分区对齐小程序 + 预取提速

**双节分区（对齐小程序 decks 页）**：书行重写为小程序 wb-option 结构——🔀 乱序版/🔤 正序版 短标签（order 字段判定）+ 静态词数（wordCount，免加载即可显示）+「导入」pill /「✓ 已导入」（disabled + selected）；BUILTIN_WORDBOOKS 补 order/wordCount 并按级别分组；乱序版 name 保持无后缀（防破坏已导入用户按 name 去重，UI 短标签独立于 name）

**已导入判定改按 source**：导入时新建牌组写 `deck.source = 词书 key`（对齐小程序）；isWordbookImported 按 source 优先、旧牌组无 source 回退按 name

**预取提速**：进入第二屏即后台并发预取该级别全部词书脚本（loadWordbookScript 去重复用、失败静默），点击导入时 registry 已就绪——实测点击到 toast 64ms（此前需等待 0.4-2MB 脚本下载+解析，为最大延迟源）

**测试**：290→294（双节结构/短标签/导入 pill、预取 4 次断言、已导入 disabled、source 优先判定 + 导入写 source）；SW 缓存 v12→v13

## 最近更新（2026-08-23）— 导入正序词书 10 本（词书系统 10→20 本）

**正序组入库**：BOOK_CONFIG/import.js BUILTIN_WORDBOOKS/build.js WORDBOOKS 三处清单各 +10 条（key 带 -sorted、name 带「（正序）」后缀，对齐小程序命名）；数据源 wordbooks-cloud 10 个 `-sorted.json`——与乱序组两两同词（56204 词），仅按字母正序排列；生成产物 20 本约 16MB（git 跟踪，CI 构建直接复制）

**导入面板第二屏改造**：renderImportLevelBooks 由每 type 取第一本（find）改为渲染全部（filter）——每级 4 本（大纲乱序/大纲正序/核心乱序/核心正序）；按 name 去重机制天然区分正序组，已导入用户不受影响

**测试**：290→292（BOOK_CONFIG 20 本 + 每级 2+2 断言 + cet4 第二屏 4 按钮）；SW 缓存 v11→v12

## 最近更新（2026-08-22）— 学习三模式审查优化（对齐小程序）

**审查结论（无行为问题项，不修）**：复习软上限 50 可被每日目标提升、深模式尾卡答对重出、深模式内单词最高推到 stage 3（3 次出现上限，后续推进由复习模式负责）、每次作答全量 saveData（数据安全优先）、快速答错不进错题本——均与小程序同款行为

**深度模式新词数跟随每日目标**：删除死配置 newWordsPerSession（v2.7 删设置入口后无写入点），新词队列截断改 getDailyGoal()（对齐小程序 slice(0, goal)，引导页设目标即改变每轮新词量）；buildStudyQueue 兜底分支（failed 死路径 Object.assign 副本 + EF 排序）与 collectDueCards 死代码删除

**牌组卡「学习」按钮删除**：对齐小程序 08-21 操作行精简——牌组卡只留「编辑/删除」，学习统一从学习 tab 引导页进入（原按钮实际启动复习模式，语义混乱）；startStudy 兼容别名一并删除（app.js 旧注释改写）

**会话初始化补齐**：startReview/startFailedReview 补队列卡 initEbbinghaus + _sessionAppearances/_consecutiveFails 清零（对齐小程序 initStudy 统一清零——修复 quick 模式积累连败带进复习影响 calculateFallbackStage 连败≥2 分支）

**防御修复**：restoreStudyProgress 校验失败时回滚已写会话状态（防残留误进完成面板「完美通关」）；复习上限表达式改用到期卡数（min(50, cards.length)，行为等价、语义对齐小程序 safeCards.length）；quick 队列过滤前 initEbbinghaus（畸形字符串 stage 归一为新词进队）

**测试**：284→290；SW 缓存 v10→v11；README 过期描述修正（SM-2 双算法 → 单轨）

## 最近更新（2026-08-22）— 卡片界面单词分类筛选（对齐小程序 preview filter-tabs）

**四分类 pill**：卡片面板新增「全部/新词/学习中/已掌握」胶囊筛选（`分类名 (数量)` 内联计数、选中淡主色底+主色描边；对齐小程序 preview.vue 口径：新词 stage0/无、学习中 1-6、已掌握 ≥7）；筛选状态 `App._cardFilter` 会话内保持（切走再回不重置，避免预览搜索丢状态的已知问题）；虚拟滚动/删除基于保留 deck.cards 原下标的 `{card,index}` 对（data-index 原下标，删除/批量删除零错位）；分类空态「该分类暂无单词」；新增 utils.js `cardStageCategory`/`filterCardsByStage` 纯函数

**测试**：276→284（utils 分类 +3、cards-panel 筛选 +5；setup.js 新增 mountCardsDOM 桩 + cards-panel.js 加载）

## 最近更新（2026-08-22）— 删除统计界面分享功能

**分享模块删除**：统计页「📣 分享」模块与按钮删除（对齐小程序统计页无分享）；`App.shareAchievement`（唯一调用者即该按钮）成死代码一并删除；README 功能清单与 v2.7「保留」清单同步清理；测试 276→275

## 最近更新（2026-08-22）— 每日目标设置移至学习模式选择界面

**设置入口迁移**：统计页「🎯 每日目标」模块整体移到学习模式引导页（设置输入框 + 今日进度条，样式复用 stats.css .daily-goal*）；保存校验 5-200 → 写 localStorage → 进度文本/条局部刷新（不重建引导，保住错词折叠区展开态）+ toast；统计页只保留 KPI 行「⚡ 目标进度」卡；新增 utils.js `getDailyGoal()` 共享读取（默认 10 + 损坏兜底），stats-panel 与 study-panel 两处复用

**测试**：274→276（引导页设置渲染 + 保存写库 2 例；stats-panel 模块断言更新）

## 最近更新（2026-08-22）— 统计页 UI 去小程序化（双列 Web 仪表盘）

**布局重构**：KPI 指标行（🔥连续打卡/📊本周单词/🎯正确率/⚡目标进度 4 卡）→ 双列仪表盘（左列：周报/总览/错题；右列：日历/曲线/目标/分享）→ 热力图与阶段分布跨列；页面高度 2357→约 1400px；移动端（≤480px）KPI 2 列、双列变单列、热力图恢复横向滚动

**视觉 Web 化**：内容卡统一回 Web 惯例（12px 圆角 `--radius-md` + `--shadow-sm` 阴影 + 无边框，替代 16px 描边小程序卡）；空状态按钮删除渐变光晕 pill 改标准 2px 边框按钮；周柱恢复数值标注 + hover；热力图 12→26 周（GitHub 风格半年视图、11px 格 + hover scale 1.5、桌面无滚动）；日历格 34→40px + hover；canvas 曲线去内联宽高改 CSS 自适应窄列

**数据层**：buildHeatmapWeeks 加 weekCount 参数（默认 12 兼容旧调用）；buildWeekSeries bars 加 total 数值

**测试**：273→274（26 周视图 +1；KPI/双列/周柱数值断言更新）；Playwright 桌面+移动双视口验证通过

## 最近更新（2026-08-21）— 统计页面重设计（对齐小程序 stats 页 + 保留 Web 特有）

**11 模块重排**：空状态（无卡无日志时显示「还没有学习数据」+「开始学习 →」跳学习 tab）→ 连续打卡卡（🔥 N 天横向卡）→ 本周学习报告（学习单词/学习天数/正确率三指标 + 副文案 + ↑↓ 涨跌趋势 + 7 根周柱 clamp(4, count/100*60)）→ 总览卡（总词汇量/已掌握/今日待复习/明日待复习，Web 特有保留）→ 打卡日历（‹ › 翻月、周一为首日、打卡日紫底/今日紫框）→ 12 周热力图（星期标签列 + 横向滚动 13 列 + 5 档色阶双主题 CSS class）→ 遗忘曲线（Canvas 340×200 双线：理论虚线 + 个人实线 + 评语，dpr 缩放 + 主题色读取 + 主题切换重绘钩子）→ 艾宾浩斯 8 阶段分布（8 色横条、按最大归一化）→ 错题统计 / 每日目标 / 分享（Web 特有保留）

**架构**：聚合纯函数抽 stats-aggregate.js（mergeLogs/buildWeekSeries/buildCalendarData/buildHeatmapWeeks/heatLevel/stageDistribution/estimateUserCurve/curveNoteText + STAGE_LABELS/STAGE_COLORS/THEORETICAL_CURVE 常量）；Canvas 曲线抽 stats-curve.js（renderCurveSectionHtml/drawStatsCurve/refreshStatsCharts，jsdom 守卫）；stats-panel.js 重写为编排层（5 个日志 API 逐字保留）；CSS 拆 stats.css + stats-charts.css（日历/热力图/曲线）

**统计口径对齐小程序**：quick-log 与 learning-log 合并（同日深度覆盖快速）——streak/周报/日历/热力图/曲线/每日目标统一读 mergedLog（此前只读 learning-log，快速浏览不计入统计）；已知偏差：分享文案仍只读 learning-log（保持不动）；UTC vs 本地日历错位与小程序同款行为不修

**测试**：240→273（stats-aggregate 纯函数 +24、stats-panel DOM/打卡 +7、每日一句竞态 +1、isFuture +1）；setup.js mock canvas getContext 消 jsdom 噪音；SW 缓存 v9→v10

**审查修复（同日，6 项）**：① [中] buildWeekSeries/buildHeatmapWeeks 星期运算统一改用 UTC（getUTCDay/setUTCDate）——修复 UTC+8 下（含凌晨 00:00-08:00 窗口）周报柱标签 +1 天偏移与两模块星期不一致 ② [中] switchQuote 定时器 id 化 + renderDailyQuote 重建时 clearTimeout——修复动画中重建后旧回调改写当日句的竞态 ③ 热力图未来日期格加 isFuture 淡显且无 tooltip（对齐小程序）④ _calState 空状态分支复位（数据重新出现时日历回当月）⑤ 日历翻月按钮 min 44px 触控目标 + 移动端 streak-card 换行 ⑥ 文档修正（CSS 文件数、测试增量）

## 最近更新（2026-08-21）— 每日名言点击切换（对齐小程序）

**整卡点击顺序切换**：daily-quote.js 新增 getNextQuote（顺序循环取下一句，不写 storage 仅会话内生效）+ switchQuote（防抖守卫 + 150ms 淡出下沉动画换文本 + 150ms 恢复，对齐小程序 quote-card 交互）；pickTodayQuote 同步展示索引；renderDailyQuote 抽 _quoteHtml 共用 + 绑定 el.onclick（innerHTML 重建不累积监听）+ 重建重置切换态；deck.css 补 cursor/transition/:active/quote-switching 样式；switchTab 回牌组 tab 时刷新每日一句（对齐小程序 onShow 回当日句）

**测试**：235→240（daily-quote +5：顺序循环/末尾回绕/storage 不写/防抖/重建重置）

## 最近更新（2026-08-21）— 学习模式重选 + 错词本并入模式引导页

**切走重选学习模式**：switchTab 切离学习 tab 时调 returnToModeSelect 弃置当前会话（早退日志 completedGoal=false、清内存状态、删 sessionStorage 快照），切回学习 tab 重新显示「选择学习模式」引导；学习 tab 内重复点击/「开始学习」/牌组「学习」按钮不受影响（目标 tab 即 study 不清理）；完成面板新增「↩ 返回模式选择」按钮（顺带修复完成态无返回入口）；页面刷新后的快照恢复（TTL 2h）保留不动

**错词本并入引导页**：删除顶部/底部导航「错词本」tab 与独立面板 #panelWrong（5 个 tab），错词本独有功能（错词列表 + 单卡移出）并入学习模式引导页「错题强化」卡片下方的折叠区（默认收起、展开浏览、移出后原位刷新保持展开态）；错题强化卡片计数改动态（N 个待强化/暂无错词）；wrong-words.js 重写为错词列表模块（renderModeFailedSectionHtml/bindModeFailedSection/refreshModeFailedSection，删死代码 getWeekWrongCount）；批量练习按钮废弃（与点击错题强化卡片等价）

**审查修复（2026-08-21）**：早退条目不覆盖当日已完成会话（finalizeStudyLog 加守卫——切 tab 弃置会话不再回退当日统计/目标/热力图）；SW 缓存 v8→v9（已装 PWA 用户可获新版）；完成面板按钮顺序稳定（exitBtn2 insertBefore backBtn）；折叠区 toggle min-height 44px 触控目标；switchTab 未知 tab 不触发会话清理；删除 app.js btnRestart 双重绑定（修「再学一组新词」实际启动复习的既有 bug——onclick 由完成面板渲染统一接管）

**测试**：219→235（study-tab 切离弃置 +8、wrong-words 折叠区 +6、study-panel 返回按钮 +3、stats 覆盖守卫 +2、其余回归）

## 最近更新（2026-08-21）— 拼写单隐藏输入框方案 + tts 韧性（对齐小程序最新方案）

**方案级调整**：弃用多 input 格子框（移动端键盘反复弹跳），改为**下划线展示位（纯 view）+ 单隐藏输入框**——键盘只弹一次；`_renderSpellSlots` 局部渲染（隐藏框在 #spellSlots 容器外，重渲染不丢焦点）；隐藏框 native 值为真值源、全量重建字母（退格天然撤回、中文 commit 不误删）；满词 150ms 防抖自动判定；点槽位区聚焦（揭示期禁弹键盘）；当前输入位闪烁竖线光标（满词/失焦/判定期隐藏）

**错误揭示**：错位红显指错（对位保持）+ 下方下划线样式答案行完整揭示 + feedback 仅「❌ 拼写错误」不含答案；**2000ms 后自动清空盲拼重试**（防照着拼写，600→2000）

**纯函数移植**：parseWordSlots/lettersOnly/rebuildSlotLetters/firstEmptySlotIndex（utils.js，对齐小程序 helpers.js）；删除 buildSpellSlotHtml/readSpellSlots/_clearSpellSlots 与多槽三委托

**tts 韧性**：`_playAudioAttempt` 失败 600ms 重试一次 + `_audioPlaySeq` 防旧重试打断新播放 + toggleAccent 失效旧重试；二次失败才 toast

**附带修复**：getOverdueDays 日期统一 UTC（'Z' 解析 + UTC 日界）——修复本地 00:00-08:00 窗口今日到期被误判逾期 1 天（对齐小程序同款修复），凌晨窗口下 4 个日期敏感测试恢复通过

**测试**：201→219（utils 纯函数 +17、spell-mode 重写、UTC 修复）；Playwright 端到端 24/24 + tts 重试 5/5 通过

## 最近更新（2026-08-19）— v2.8 学习算法全量对齐小程序

**单轨化**：删除 SM-2（applySM2 与 nextReview/interval 双轨），applyEbbinghaus 重写为小程序 ES5 等价实现——智能回退（连败≥2 才回 1 级）、逾期惩罚不叠加、EF 自适应间隔（+0.1/-0.2、封顶 3.5/下限 1.3）、逾期>7天答对降级门控、history 带 quality、initEbbinghaus 防御（NaN/夹紧/截断 100）

**深度动态队列**：新词模式 splice 重插（错+3/对+5/+10/+15）、出现≥3次或阶段≥4 移出、●●○ 计数点、回看按钮；进度显示"已学 N/M 词"

**快速模式**：队列 stage<5 + 优先级排序 + dailyGoal 截断；答对仅 0→1（已学词不再被降级——修复核心 bug）；答错 wrongCount/wrongDates 追踪

**复习模式**：calcUrgencyScore 紧急度排序 + 软上限 50

**统计**：逐答计数改为会话完成按卡去重汇总（当日覆盖），日志含 duration/completedGoal；已掌握口径 stage≥7

**测试**：123→163（ebbinghaus 改写+16、quick-mode 重写、study-queue +9、deep-mode +10、stats-panel +8）

**审查修复（2026-08-19）**：与小程序逐行比对后修复 7 项——回看态守卫移至 answerStudy/checkSpelling 首行（防拼写绕过改写调度+污染统计）、quick 分支空卡守卫（防删卡后 TypeError）、exitReviewMode 清理残留会话（防旧统计复显）、快照存 elapsed 恢复重锚 startTime（时长不计关闭空闲，对齐 timerSeconds 口径）、完成面板 ✅/❌ 与 accuracy 统一按卡去重口径、恢复快照与牌组做 id 交叉校验、returnToModeSelect 已完成会话不再覆盖日志；每日目标默认 20→10 + NaN 兜底（对齐小程序）；测试 163→175

## 最近更新（2026-08-15）— v2.7 反向对齐小程序

**删除 Web 独有功能（19 项）**：智能混合模式（restore 旧会话归一化为 review）、运行时排序切换（队列固定 EF 升序）、全局搜索、键盘快捷键、移动端手势（滑动/长按/上滑朗读）、彩带、牌组导出、外部词书导入（文件/URL/粘贴）、系统通知提醒、备份提醒+数据备份区、云同步（SyncProvider 半成品死代码）、小程序引导条、卡片批量粘贴导入、演示数据、学习头部错题复习按钮、每日一句换一句按钮、新词数设置输入框、预览隐藏释义开关、错词 CSV 导出；LOCAL_KEYS 死数组清理

**保留**：PWA 离线/安装、拼写模式、预览搜索、卡片批量删除、统计面板、错题强化练习/移出（2026-08-21 起并入学习模式引导页）、快速模式、内置词书导入、待复习 toast

**测试**：115→114（删除 nextQuote 用例 + wrong-words CSV 断言）

## 卡片数据结构（扩展）

```json
{
  "id": "...",
  "front": "abandon",
  "back": "丢弃；放弃",
  "easeFactor": 2.5,
  "repetitions": 0,
  "interval": 0,
  "nextReview": "2026-06-01",
  "ebbinghausStage": 0,
  "ebbinghausNextReview": "2026-06-01",
  "ebbinghausHistory": []
}
```

- **ebbinghausStage** (0-7)：0=新词，1-6=复习阶段，7=已掌握（90 天后仍会到期再进复习队列，与小程序一致）
- **ebbinghausNextReview**：下次艾宾浩斯复习日期
- **ebbinghausHistory**：[{stage, date, passed}] 复习记录
- 兼容旧数据：initEbbinghaus() 自动迁移，无艾宾浩斯字段的卡片从 SM-2 状态推断初始阶段

## 艾宾浩斯遗忘曲线阶段

| 阶段 | 间隔 | 说明 |
|------|------|------|
| 0    | 0天  | 新学 |
| 1    | 1天  | 第一次复习 |
| 2    | 2天  | 第二次复习 |
| 3    | 4天  | 第三次复习 |
| 4    | 7天  | 第四次复习 |
| 5    | 15天 | 第五次复习 |
| 6    | 30天 | 第六次复习 |
| 7    | 90天 | 已掌握（不再主动推送复习）|

- 通过 → 推进到下一阶段（quality='correct'）；逾期>7 天且 prevStage>1 时答对触发降级门控
- 失败 → 智能回退（stage≤2 或连败≥2 → 阶段 1，否则退 1 级）+ 逾期惩罚取 min 不叠加
- easeFactor/repetitions 由 applyEbbinghaus 统一维护（EF+0.1/-0.2、间隔 ×EF/2.5 自适应）

## 学习进度持久化

- sessionStorage 保存当前学习队列（模式、队列、索引、成绩）
- beforeunload / visibilitychange 事件触发保存
- renderStudyPanel 时自动检查并恢复未完成的进度（2 小时过期；快照存累计 elapsed 秒，恢复时重锚 startTime 不计关闭空闲）

## 数据规范化

- `App.getCardFront(c)` / `App.getCardBack(c)` 安全获取卡片正反面，自动处理 `front`/`word` 回退和 `definitions` 数组/字符串兼容
- `App._ensureDefinitionsArray(defs, fallback)` 确保 `definitions` 始终为数组格式
- `App.migrateCardsSchema()` 启动时自动修复旧数据：将非数组 definitions 包装为数组，补全缺失的 front/back 字段

## 已知限制

- **file:// 协议 Service Worker 同步抛异常**：Chrome 中 `navigator.serviceWorker.register()` 在 file:// 下同步抛出 TypeError，`.catch()` 无法捕获。修复方法：外层加 `try-catch`（index.html 和 scripts/build.js 同步处理）
- **预览面板搜索过滤后不记住状态**：切换到其他面板再返回预览时，搜索条件会被重置
- **`build.js` 移除内联 `<style>` 依赖 CSS 文件已有样式**：index.html 中内联的全局搜索和移动端样式已在 components.css 中冗余定义，构建时安全移除；如需新增内联样式必须先同步到对应 CSS 文件

## 构建

```
npm run build   -- esbuild 构建到 dist/
npm run dev     -- npx serve dist/ 本地预览
```

## 关键状态 key

- `flashcard-data` — 牌组 + 卡片 + 艾宾浩斯状态（SM-2 字段已退役保留）
- `flashcard-learning-log` — 每日学习记录（深度模式）
- `flashcard-quick-log` — 快速模式独立每日记录
- `flashcard-daily-goal` — 每日目标词数
- `flashcard-new-words-per-session` — 每轮新词学习数
- `flashcard-study-progress` — 学习进度（sessionStorage，含 mode 字段，quick 模式复用）
- `flashcard-theme` — 主题偏好
- `flashcard-tts-accent` — 发音口音偏好
- `flashcard-quote-date` / `flashcard-quote-index` — 每日一句（同日同句）
