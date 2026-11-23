# AI 数学公式速查表

高等数学、线性代数、离散数学、概率统计、数值分析公式速查表，涵盖大学期末考试必备公式。

同一套代码发布为网页（PWA）、Windows 桌面应用与 Android 应用。

## 在线访问与下载

- 网页版：**[lx825-ai.github.io/study-tools/math/](https://lx825-ai.github.io/study-tools/math/)**
- 安装包：仓库 [Releases](../../releases) 里的 `MathReference-<版本>-win-x64-setup.exe`（Windows）与 `math-reference-<版本>-android.apk`（Android，debug 签名，侧载安装）

## 功能

- **5 大学科，34 章节，177 条公式**
- **全文搜索**（300ms 防抖），支持学科/难度筛选，搜索建议自动补全
- **公式测验** — 选择题 + 闪卡记忆两种模式，错题复习，历史成绩追踪
- **每日挑战** — 每日 5 道随机选择题，连续打卡天数 + 成就 emoji
- **收藏 + 最近浏览**，数据持久化到 localStorage
- **个人笔记** — 每条公式可添加学习笔记
- **多格式复制** — LaTeX / Markdown / 分享链接一键切换
- **公式导出为图片** — SVG 渲染 + PNG 下载，带学科色条
- **三种主题**：自动 / 暗色 / 亮色
- **网格/列表双视图**，支持打印
- **键盘快捷键**：`Ctrl+K` 搜索、`Alt+F` 收藏、`Alt+G` 切换视图、`Alt+T` 主题、`Alt+R` 随机
- **学习进度追踪** — 按章节统计已浏览公式
- **PWA** 离线可用，Service Worker 缓存
- **无障碍**：aria 属性、键盘操作、屏幕阅读器友好

## 技术栈

React 18 · TypeScript · Vite 6 · KaTeX · Vitest

## 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建（tsc --noEmit + vite build）
npm test         # 运行测试（6 文件 48 用例）
```

## 打包 App

`dist/` 用相对路径（`base: './'`）产出，可直接被 Electron / Capacitor 加载：

```bash
# 仓库根目录执行
npm run package:desktop:math   # Windows 安装包 → dist-apps/desktop-math/
npm run package:android:math   # Android APK → dist-apps/（需 JDK 21 + Android SDK）
```

## 部署

- 网页：推送 `main` 分支且改动 `web/math-web/**` 时，GitHub Actions 自动部署到 GitHub Pages。
- 应用：打 tag `v*` 触发 `.github/workflows/release.yml`，产出安装包并汇总成一个 Release。
