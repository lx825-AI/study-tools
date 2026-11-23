/**
 * Flashcard 抽认卡 桌面端壳（Electron）
 *
 * 加载 English-web 的构建产物（bundle/，由 scripts/prepare-dist.mjs 复制）。
 * 用自定义 app:// 协议而不是 file://：自定义协议注册为 standard + secure
 * 后拥有稳定的安全来源，IndexedDB 与 localStorage 才能正常持久化。
 * Service Worker 在自定义协议下不可用，页面里的注册失败已被 catch 吞掉，
 * 桌面端本身加载的是本地文件，不需要离线缓存。
 */
const { app, BrowserWindow, protocol, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const SCHEME = 'app';
const BUNDLE_DIR = path.join(__dirname, 'bundle');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
]);

/** 把 app://bundle/<path> 映射到 bundle 目录内的文件；越界返回 null */
function resolveBundlePath(requestUrl) {
  const { pathname } = new URL(requestUrl);
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const target = path.normalize(path.join(BUNDLE_DIR, relative));
  if (target !== BUNDLE_DIR && !target.startsWith(BUNDLE_DIR + path.sep)) return null;
  return target;
}

function registerProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const filePath = resolveBundlePath(request.url);
    if (!filePath) return new Response('Not found', { status: 404 });
    try {
      const data = await fs.readFile(filePath);
      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      return new Response(data, { headers: { 'content-type': type } });
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
    title: 'Flashcard 抽认卡',
    backgroundColor: '#f0f4f8',
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

app.whenReady().then(() => {
  registerProtocol();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
