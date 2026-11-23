/**
 * app:// 协议的路径解析与 MIME 表 —— 纯函数，可在无 Electron 环境下用 node --test 直接测。
 *
 * resolveBundlePath 是安全边界：解析后落在 bundle 目录之外的请求一律返回 null，
 * 覆盖 ../ 越界、编码后的 %2e%2e%2f 越界、非法百分号编码与非法 URL。
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

function contentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

module.exports = { MIME_TYPES, resolveBundlePath, contentType };
