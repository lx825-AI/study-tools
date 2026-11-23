# desktop-english

Electron 33 壳，加载 `web/English-web/dist` 的静态产物，打包成 Windows NSIS 安装包。

```bash
# 先在仓库根构建 web（或 npm run build:english）
npm install
npm start        # 开发：拷贝 dist → bundle/ 后启动 Electron
npm run dist     # 打包：dist-apps/desktop-english/Flashcard-<版本>-win-x64-setup.exe
```

- `scripts/prepare-dist.mjs` 把 `../../web/English-web/dist` 拷到 `bundle/`；`bundle/` 不入库。
- `main.js` 注册 `app://` 特权协议加载 `app://bundle/index.html`，`resolveBundlePath` 拦截越界路径；外部 http(s) 链接交给系统浏览器。
- `electron-builder.yml` 里的 `productName` 是「Flashcard 抽认卡」，`appId` 为 `com.lx825.flashcard`。
- 没配代码签名，用户首次运行会遇到 SmartScreen 提示（见仓库根 README「安装与首次运行」）。
