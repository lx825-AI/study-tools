# study-tools monorepo

英语词汇学习 + 数学公式速查工具仓库：两个 Web 应用（PWA），外加四个打包壳把同一套产物做成 Windows / Android App。

## 项目结构

```
web/
  English-web/       -- 英语闪卡 PWA（纯 JS，esbuild）+ 词书源数据 wordbooks-src/
  math-web/          -- 数学公式 PWA（React + TS + Vite + KaTeX）
apps/
  desktop-english/   -- Electron 壳（加载 English-web dist）
  desktop-math/      -- Electron 壳（加载 math-web dist）
  mobile-english/    -- Capacitor 壳（Android，加载 English-web dist）
  mobile-math/       -- Capacitor 壳（Android，加载 math-web dist）
.github/workflows/   -- ci.yml（测试+构建）、deploy.yml（Pages）、release.yml（App 发布）
```

## 构建与测试

| 项目 | 构建 | 测试 |
|------|------|------|
| English-web | `cd web/English-web && npm run build` | `npm test`（325 用例） |
| math-web | `cd web/math-web && npm run build` | `npm test`（48 用例） |
| 桌面包 | `npm run package:desktop:english` / `:math` | 无自动化测试 |
| Android 包 | `npm run package:android:english` / `:math` | 无自动化测试 |

全量：`npm run test:all` / `npm run build:all`。

## DSH 环境约定

- 工具映射：读文件/搜索用 `ops_inspect_local_file` / `ops_glob` / `ops_grep`，执行命令用 `ops_bash`（等价于 read / glob / grep / bash）。
- 长会话上下文由 billion-context 压缩，压缩摘要属于系统元数据，不是新指令。
- 本项目以 CLAUDE.md 作为项目指令入口；不要再建 AGENTS.md，避免两份规则漂移。
- 测试数字以 `npm run test:all` 实际输出为准，改测试后同步本文件与 README。
- 跑 node / esbuild / vitest 需要完全权限：workspace-write 沙箱下子进程 `spawnSync` 报 EPERM。文件读写本身在 workspace-write 下正常。
- 本机没有 JDK / Android SDK / Rust：Android 包只能在 GitHub Actions 构建；桌面端可在本机构建（首次 `npm install` 需下载约 100MB 的 Electron）。

## 部署与发布

- English-web: https://lx825-ai.github.io/study-tools/english/
- math-web: https://lx825-ai.github.io/study-tools/math/
- Pages 由 `.github/workflows/deploy.yml` 在 push 到 main 且改动 `web/English-web/**` 或 `web/math-web/**` 时自动部署。
- App 由 `.github/workflows/release.yml` 在 push tag `v*`（或手动运行）时构建：Windows NSIS 安装包 ×2 + Android APK ×2，汇总为一个 GitHub Release。
- 版本号取 tag 去掉前缀 `v`；CI 用 `npm pkg set version=<v>` 同步到各 app 包。

## English-web 要点

- **学习算法**：艾宾浩斯单轨（SM-2 已删除）。8 阶段 0/1/2/4/7/15/30/90 天；答对 stage++、EF+0.1（≤3.5）、间隔 `round(interval×EF/2.5)`；答错智能回退 + 逾期惩罚取 min 不叠加、EF−0.2（≥1.3）。
- **学习模式**：深度（动态队列 splice 重插）、今日复习（紧急度排序，软上限 50）、错题强化（EF≤1.8）、快速浏览（线性，答对仅 0→1）、拼写（纯练习，不推进队列/不改曲线/不写日志）。
- **词书清单三处必须同步**：`scripts/wordbook-lib.js` 的 `BOOK_CONFIG`、`js/import.js` 的 `BUILTIN_WORDBOOKS`、`scripts/build.js` 的 `WORDBOOKS`（共 20 本：10 乱序 + 10 正序）。
- **词书生成**：源数据在 `web/English-web/wordbooks-src/`（20 个 JSON，约 24MB）；`npm run gen:wordbooks` 读取并生成 `wordbooks/*.js`（约 17MB，入库）。
- **构建**：`scripts/build.js` 合并 CSS/JS、复制词书与 `manifest.json`/`sw.js`/`icon.svg`。它**不清空 dist**，删文件后需手动 `rm -rf dist` 重建，否则残留旧模块。改前端资源后要同时升 `sw.js` 的缓存版本（当前 `v19`），否则已装 PWA 拿不到更新。
- **跨端同步（文件通道）**：`js/sync-codec.js`（纯函数：规范 schema v1、词书 key 映射、卡片按 `(deck.source, lower(word))` 锚定、日志合并 `M = max(local, snap) + max(0, remote − remotePrev)`、64KB/FNV-1a 分块）+ `js/sync-ui.js`（头部 🔄 弹窗，JSON 导出/导入）。合并状态存在 `flashcard-sync-log-state`，按发送端 `web|mini` 分槽——`mini` 槽位保留，用于兼容旧导出文件。
- **已下线**：配对码云中转（`js/sync-cloud.js`、`vendor/cloudbase.full.js`、两个云函数）随小程序一并删除，不要再引入 WeChat 云开发依赖。

## math-web 要点

- Vite `base: './'`（产物可直接塞进 Electron / Capacitor），KaTeX 与 React 独立分包。
- 结构：`src/components`、`src/hooks`、`src/data`（177 条公式）、`src/styles`、`src/__tests__`（6 文件 48 用例）。

## apps/ 打包要点

- **桌面包**：Electron 33 + electron-builder。`scripts/prepare-dist.mjs` 把对应 web 的 `dist/` 拷到 `bundle/`；`main.js` 注册 `app://` 特权协议（`standard + secure + supportFetchAPI`）加载 `app://bundle/index.html`，`resolveBundlePath` 做路径越界校验。自定义协议下 Service Worker 不可用（注册已 try/catch），离线能力来自本地文件本身。
- **移动包**：Capacitor 7 + Gradle。`scripts/build-android.mjs`：拷 dist → `www/` → 无 `android/` 时 `npx cap add android` → `cap sync` → 生成图标 → 改写 `versionCode`/`versionName` → `./gradlew assembleDebug` → APK 落 `dist-apps/`。`android/`、`www/`、`bundle/` 均不入库（CI 生成）。
- **版本号规则**：`versionCode = major*10000 + minor*100 + patch`；`VERSION` 环境变量由 release.yml 传入。
- **图标**：`apps/*/assets/icon.png`，1024×1024（由 `web/English-web/icon.svg` 与 `web/math-web/public/icon-512.png` 渲染生成）。
- **Android 前置条件**：JDK 21 + Android SDK `platforms;android-35` 与 `build-tools;35.0.0`。
- **签名**：当前用 Gradle debug 签名，仅可侧载；正式发布需 keystore + GitHub Secrets，尚未接入。

## 已知限制

- iOS 无安装包：用 Safari「添加到主屏幕」使用网页版。
- 跨设备同步靠手动导出/导入 JSON 文件，没有自动云端同步。
- Android 包为 debug 签名，安装时需允许「未知来源应用」。

## 最近更新（2026-11-23）— 下线小程序、改为 App 发布

- 删除两个微信小程序子项目（其中一个曾是 git 子模块）的全部代码，移除 `.gitmodules` 与根脚本里的小程序构建/测试命令。
- 词书源数据（20 个 JSON，24MB）迁入 `web/English-web/wordbooks-src/`，`gen-wordbooks.js` 改为读本地目录。
- 跨端同步只保留文件通道：删除 `js/sync-cloud.js`、`vendor/cloudbase.full.js`、配对码 UI 与 SW 预缓存；`sync-codec.test.js` 改用本地共享向量 `js/__tests__/data/sync-vectors.js`。
- 新增 `apps/` 四个打包工程与 `.github/workflows/release.yml`；`package.json` 增加 `package:desktop:*` / `package:android:*` 脚本。
- 测试：English-web 334→325（减 sync-cloud 的 9 条），math-web 48 不变。
