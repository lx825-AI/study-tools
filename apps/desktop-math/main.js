/**
 * 数学公式速查 桌面端壳（Electron）
 *
 * 加载 math-web 的构建产物（bundle/，由 scripts/prepare-dist.mjs 复制）。
 * 用自定义 app:// 协议而不是 file://：自定义协议注册为 standard + secure
 * 后拥有稳定的安全来源，IndexedDB 与 localStorage 才能正常持久化。
 * Service Worker 在自定义协议下不可用，页面里的注册失败已被 catch 吞掉，
 * 桌面端本身加载的是本地文件，不需要离线缓存。
 */
const { app, BrowserWindow, dialog, protocol, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { resolveBundlePath, contentType } = require('./lib/protocol');

const SCHEME = 'app';
const BUNDLE_DIR = path.join(__dirname, 'bundle');

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
]);

/** 把 app://bundle/<path> 映射到 bundle 目录内的文件；越界返回 null（实现在 lib/protocol.js） */
function registerProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const filePath = resolveBundlePath(BUNDLE_DIR, request.url);
    if (!filePath) return new Response('Not found', { status: 404 });
    try {
      const data = await fs.readFile(filePath);
      return new Response(data, { headers: { 'content-type': contentType(filePath) } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '数学公式速查',
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.once('ready-to-show', () => win.show());

  /* 站外链接交给系统浏览器，站内导航仅允许 app:// */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(SCHEME + '://')) return;
    event.preventDefault();
    if (/^https?:/i.test(url)) shell.openExternal(url);
  });

  win.loadURL(SCHEME + '://bundle/index.html');
}

/** 打包后从 GitHub Release 检查更新；下载完成提示重启（开发模式跳过） */
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (err) {
    console.warn('[update] electron-updater 未安装，跳过自动更新:', err.message);
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.on('error', (err) => console.warn('[update] 检查更新失败:', err && err.message));
  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        buttons: ['立即重启', '稍后'],
        defaultId: 0,
        cancelId: 1,
        message: '发现新版本 ' + (info && info.version ? info.version : ''),
        detail: '更新已下载，重启应用即可生效。'
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      })
      .catch((err) => console.warn('[update] 提示失败:', err && err.message));
  });
  autoUpdater
    .checkForUpdatesAndNotify()
    .catch((err) => console.warn('[update] 检查失败:', err && err.message));
}

app.whenReady().then(() => {
  registerProtocol();
  createWindow();
  setupAutoUpdate();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
