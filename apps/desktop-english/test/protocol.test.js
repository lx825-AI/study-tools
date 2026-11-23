/**
 * app:// 协议路径解析与 MIME 的单元测试（node --test，不需要 Electron）。
 */
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { resolveBundlePath, contentType } = require('../lib/protocol');

const BUNDLE = path.resolve('/fake/bundle');

test('根路径映射到 index.html', () => {
  assert.strictEqual(resolveBundlePath(BUNDLE, 'app://bundle/'), path.join(BUNDLE, 'index.html'));
});

test('普通资源路径保留原文件名', () => {
  assert.strictEqual(
    resolveBundlePath(BUNDLE, 'app://bundle/app.bundle.js?v=123'),
    path.join(BUNDLE, 'app.bundle.js')
  );
});

test('URL 规范化后仍落在 bundle 内（字面 ../ 不会逃出目录）', () => {
  for (const url of ['app://bundle/../secret.txt', 'app://bundle/../../secret.txt']) {
    const resolved = resolveBundlePath(BUNDLE, url);
    assert.ok(
      resolved === null || resolved.startsWith(BUNDLE + path.sep),
      '请求不得逃出 bundle 目录：' + resolved
    );
  }
});

test('编码后的越界（%2e%2e%2f）返回 null', () => {
  assert.strictEqual(resolveBundlePath(BUNDLE, 'app://bundle/%2e%2e%2fsecret.txt'), null);
  assert.strictEqual(resolveBundlePath(BUNDLE, 'app://bundle/..%2f..%2fsecret.txt'), null);
});

test('非法百分号编码返回 null', () => {
  assert.strictEqual(resolveBundlePath(BUNDLE, 'app://bundle/%E0%A4%A'), null);
});

test('非法 URL 返回 null', () => {
  assert.strictEqual(resolveBundlePath(BUNDLE, 'not a url'), null);
});

test('同名前缀目录不算越界（bundle2 不在 bundle 内）', () => {
  assert.strictEqual(resolveBundlePath(BUNDLE, 'app://bundle/%2e%2e%2fbundle2%2fx.js'), null);
});

test('MIME 按扩展名返回，未知回退二进制', () => {
  assert.match(contentType(path.join(BUNDLE, 'index.html')), /^text\/html/);
  assert.match(contentType(path.join(BUNDLE, 'app.bundle.js')), /javascript/);
  assert.strictEqual(contentType(path.join(BUNDLE, 'icon.PNG')), 'image/png');
  assert.strictEqual(contentType(path.join(BUNDLE, 'wordbooks.js')), 'text/javascript; charset=utf-8');
  assert.strictEqual(contentType(path.join(BUNDLE, 'data.unknownext')), 'application/octet-stream');
});
