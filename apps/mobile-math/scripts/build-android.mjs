/**
 * Android 打包流水线：复制 math-web 产物 → 生成/同步 android 工程 → 构建 APK。
 *
 * 签名策略：四个 ANDROID_* 环境变量齐全时构建 release 签名 APK（可覆盖升级），
 * 否则退回 debug 签名 APK（跨版本覆盖安装可能被系统拒绝）。
 * 前置条件：JDK 21 + Android SDK（ANDROID_HOME 已设置，含 platform 35）。
 * 本机没有 Android 工具链时只能在 CI 运行。
 * 用法：VERSION=1.2.3 npm run android（默认 1.0.0）
 */
import { execSync } from 'node:child_process';
import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildKeystoreProperties,
  injectSigningConfig,
  resolveAndroidSigning
} from './android-signing.mjs';
import { semverToVersionCode } from './version-code.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_DIST = path.resolve(ROOT, '../../web/math-web/dist');
const WWW = path.join(ROOT, 'www');
const ANDROID = path.join(ROOT, 'android');
const OUT_DIR = path.resolve(ROOT, '../../dist-apps');
const VERSION = process.env.VERSION || '1.0.0';
const APK_NAME = `math-reference-${VERSION}-android.apk`;
const GRADLEW = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function run(command, cwd) {
  console.log(`$ ${command}`);
  execSync(command, { cwd, stdio: 'inherit', shell: true });
}

const signing = resolveAndroidSigning(process.env);

if (!(await exists(path.join(WEB_DIST, 'index.html')))) {
  console.error(`✗ 找不到 web 构建产物：${WEB_DIST}\n  请先在仓库根目录运行 npm run build:math`);
  process.exit(1);
}

await rm(WWW, { recursive: true, force: true });
await cp(WEB_DIST, WWW, { recursive: true });
console.log('✓ www 已就绪');

if (!(await exists(path.join(ANDROID, 'settings.gradle')))) {
  run('npx cap add android', ROOT);
}
run('npx cap sync android', ROOT);

if (await exists(path.join(ROOT, 'assets', 'icon.png'))) {
  run('npx @capacitor/assets generate --android', ROOT);
}

/* versionName / versionCode 跟随 VERSION（CI 按 tag 传入） */
const gradleFile = path.join(ANDROID, 'app', 'build.gradle');
const versionCode = semverToVersionCode(VERSION);
let gradle = await readFile(gradleFile, 'utf8');
gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName "[^"]*"/, `versionName "${VERSION}"`);
if (signing.mode === 'release') {
  gradle = injectSigningConfig(gradle);
}
await writeFile(gradleFile, gradle);

let apk;
if (signing.mode === 'release') {
  await writeFile(
    path.join(ANDROID, 'keystore.properties'),
    buildKeystoreProperties(signing.keystore),
    'utf8'
  );
  console.log('✓ 正式签名：使用 ANDROID_KEYSTORE_FILE 构建 release APK');
  run(`${GRADLEW} assembleRelease`, ANDROID);
  apk = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
} else {
  console.log('· 未配置签名环境变量：构建调试签名 APK（跨版本覆盖安装可能被拒绝）');
  run(`${GRADLEW} assembleDebug`, ANDROID);
  apk = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
}

if (!(await exists(apk))) {
  console.error(`✗ 未找到构建产物：${apk}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const target = path.join(OUT_DIR, APK_NAME);
await copyFile(apk, target);
console.log(`✓ APK：${target}`);
