/**
 * 把 web 构建产物复制到 Electron 包内的 bundle/ 目录。
 * 产物缺失时给出明确提示（先跑 npm run build:math）。
 */
import { cp, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_DIST = path.resolve(ROOT, '../../web/math-web/dist');
const BUNDLE = path.join(ROOT, 'bundle');

try {
  await stat(path.join(WEB_DIST, 'index.html'));
} catch {
  console.error(`✗ 找不到 web 构建产物：${WEB_DIST}\n  请先在仓库根目录运行 npm run build:math`);
  process.exit(1);
}

await rm(BUNDLE, { recursive: true, force: true });
await cp(WEB_DIST, BUNDLE, { recursive: true });
console.log(`✓ bundle 已就绪（${WEB_DIST}）`);
