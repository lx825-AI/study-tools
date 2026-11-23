/**
 * 把 web 构建产物复制到 Capacitor 的 webDir（www/）。
 * 产物缺失时给出明确提示（先跑 npm run build:english）。
 */
import { cp, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const WEB_DIST = path.resolve(process.cwd(), '../../english/English-web/dist');
const WWW = path.resolve(process.cwd(), 'www');

try {
  await stat(path.join(WEB_DIST, 'index.html'));
} catch {
  console.error(`✗ 找不到 web 构建产物：${WEB_DIST}\n  请先在仓库根目录运行 npm run build:english`);
  process.exit(1);
}

await rm(WWW, { recursive: true, force: true });
await cp(WEB_DIST, WWW, { recursive: true });
console.log(`✓ www 已就绪（${WEB_DIST}）`);
