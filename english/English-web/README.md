# 📚 Flashcard 抽认卡 — 英语学习

基于艾宾浩斯遗忘曲线的英语单词学习工具，内置 20 套词书（初中至考研），离线可用。同一套代码发布为网页（PWA）、Windows 桌面应用与 Android 应用。

## 在线访问

**[lx825-ai.github.io/study-tools/english/](https://lx825-ai.github.io/study-tools/english/)**

桌面与 Android 安装包见仓库 [Releases](../../../releases)。

## 功能

- **翻卡学习** — 艾宾浩斯单轨算法，四种学习模式（新词/复习/错题/快速浏览）
- **拼写模式** — 学习中内嵌拼写练习：释义提示 + 字母下划线槽位，纯练习不改学习进度
- **快速浏览** — 线性过词快速刷词，进度独立记录（`flashcard-quick-log`），不污染艾宾浩斯历史
- **错题强化** — 学习模式选择页集中攻克 EF≤1.8 难词，附错词列表浏览与单卡移出
- **TTS 发音** — 单词朗读，英式/美式一键切换，失败自动重试
- **每日一句** — 牌组页顶部英文名言（含中文释义），同日同句，可点击换句
- **预览与卡片管理** — 表格预览、虚拟滚动、阶段筛选、批量删除
- **学习统计** — KPI 仪表盘、周报、打卡日历、26 周热力图、遗忘曲线、阶段分布
- **数据同步** — 导出/导入 JSON 文件，在手机与电脑之间搬运学习进度
- **内置词书** — 20 套（初中/高中/四级/六级/考研 × 大纲/核心 × 乱序/正序），100% 音标
- **离线 PWA** — Service Worker 缓存；桌面端与 Android 端为本地文件加载

## 技术栈

纯原生 JavaScript（ES2017+），零运行时依赖，esbuild 构建。

## 开发

```bash
npm install            # 安装构建工具
npm run build          # 构建到 dist/
npm run dev            # 本地预览（npx serve dist/）
npm test               # vitest（19 文件 325 用例）
npm run gen:wordbooks  # 从 wordbooks-src/ 重新生成 wordbooks/*.js
```

## 词书

20 套词书由 [scripts/gen-wordbooks.js](scripts/gen-wordbooks.js) 从 `wordbooks-src/` 的 JSON 生成（数据源自 KyleBing/english-vocabulary，MIT），100% 音标覆盖。产物是紧凑单行 JS（约 16MB，入库）；SW 只预缓存 2 本最常用词书，其余按需 runtime 缓存。

新增词书要同时改三处清单：`scripts/wordbook-lib.js` 的 `BOOK_CONFIG`、`js/import.js` 的 `BUILTIN_WORDBOOKS`、`scripts/build.js` 的 `WORDBOOKS`。

## 数据存储

学习数据存 IndexedDB（主存储）+ localStorage（降级备份），包括牌组、卡片、艾宾浩斯状态与学习日志。启动时 `migrateCardsSchema` 自动修复旧格式数据。

## 数据格式

卡片支持两种格式：

- **简单格式**：`{ front: "abandon", back: "丢弃；放弃" }`
- **扩展格式**：`{ word, phonetic, pos, definitions[], phrases[], sentences[], synonyms[], antonyms[], confused[] }`

`definitions` 会自动规范化为数组，兼容字符串输入。
