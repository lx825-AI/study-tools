/**
 * app:// 自定义协议的纯逻辑（无 Electron 依赖，便于 node --test 直接测）。
 *
 * resolveBundlePath 是唯一的安全边界：任何解析后跳出 bundle 目录的请求都返回 null，
 * 包括 ../ 越界与 %2e%2e%2f 这类编码后的越界。
 */
const path = require('node:path');

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

/** 把 app://bundle/<path> 映射到 bundle 目录内的绝对路径；越界或非法编码返回 null */
function resolveBundlePath(bundleDir, requestUrl) {
  let pathname;
  try {
    pathname = new URL(requestUrl).pathname;
  } catch {
    return null;
  }
  let relative;
  try {
    relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  } catch {
    return null;
  }
  const target = path.normalize(path.join(bundleDir, relative));
  if (target !== bundleDir && !target.startsWith(bundleDir + path.sep)) return null;
  return target;
}

/** 按扩展名取 Content-Type，未知类型回退二进制 */
function contentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

module.exports = { MIME_TYPES, resolveBundlePath, contentType };
