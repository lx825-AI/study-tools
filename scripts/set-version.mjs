#!/usr/bin/env node
/**
 * 同步版本号到根 package.json、两个 web 与四个 app。
 *
 * 用法：node scripts/set-version.mjs 1.1.0
 *       VERSION=1.1.0 node scripts/set-version.mjs
 *
 * release.yml 在打 tag 后调用它，保证安装包、latest.yml 与仓库版本一致
 * （electron-updater 按 version 比较新旧，版本号写错会导致永远不提示更新）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION_RE = /^\d+\.\d+\.\d+$/;

const TARGETS = [
  'package.json',
  'web/English-web/package.json',
  'web/math-web/package.json',
  'apps/desktop-english/package.json',
  'apps/desktop-math/package.json',
  'apps/mobile-english/package.json',
  'apps/mobile-math/package.json'
];

const version = (process.env.VERSION || process.argv[2] || '').trim();
if (!VERSION_RE.test(version)) {
  console.error(`版本号必须是 x.y.z（收到 "${version}"）`);
  process.exit(1);
}

let changed = 0;
for (const rel of TARGETS) {
  const file = path.join(ROOM, rel);
  if (!fs.existsSync(file)) {
    console.warn(`跳过（不存在）：${rel}`);
    continue;
  }
  const raw = fs.readFileSync(file, 'utf8');
  const pkg = JSON.parse(raw);
  if (pkg.version === version) continue;
  pkg.version = version;
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`${rel}: ${version}`);
  changed += 1;
}
console.log(`完成，更新 ${changed} 个 package.json`);
