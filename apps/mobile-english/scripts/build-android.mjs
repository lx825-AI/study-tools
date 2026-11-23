/**
 * Android 打包流水线：复制 web 产物 → 生成/同步 android 工程 → 构建 debug APK。
 *
 * 前置条件：JDK 21 + Android SDK（ANDROID_HOME 已设置，含 platform 35）。
 * 本机没有 Android 工具链时只能在 CI 运行。
 * 用法：VERSION=1.2.3 npm run android（默认 1.0.0）
 */
import { execSync } from 'node:child_process';
import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const WEB_DIST = path.resolve(ROOT, '../../english/English-web/dist');
const WWW = path.join(ROOT, 'www');
const ANDROID = path.join(ROOT, 'android');
const OUT_DIR = path.resolve(ROOT, '../../dist-apps');
const VERSION = process.env.VERSION || '1.0.0';
const APK_NAME = `flashcard-${VERSION}-android.apk`;
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

if (!(await exists(path.join(WEB_DIST, 'index.html')))) {
  console.error(`✗ 找不到 web 构建产物：${WEB_DIST}\n  请先在仓库根目录运行 npm run build:english`);
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
const [major = 0, minor = 0, patch = 0] = VERSION.split('.').map((n) => parseInt(n, 10) || 0);
const versionCode = major * 10000 + minor * 100 + patch;
let gradle = await readFile(gradleFile, 'utf8');
gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName "[^"]*"/, `versionName "${VERSION}"`);
await writeFile(gradleFile, gradle);

run(`${GRADLEW} assembleDebug`, ANDROID);

const apk = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!(await exists(apk))) {
  console.error(`✗ 未找到构建产物：${apk}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const target = path.join(OUT_DIR, APK_NAME);
await copyFile(apk, target);
console.log(`✓ APK：${target}`);
