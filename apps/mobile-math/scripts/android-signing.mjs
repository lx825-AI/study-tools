/**
 * Android 签名配置的纯函数层 —— 不读写文件、不调用 gradle，方便 node --test 直接覆盖。
 *
 * 约定：四个环境变量齐全才走正式签名（assembleRelease），一个都没有就退回
 * 调试签名（assembleDebug）；只配了一部分视为配置错误，直接报错而不是悄悄降级。
 */
export const SIGNING_ENV_KEYS = [
  'ANDROID_KEYSTORE_FILE',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD'
];

export function resolveAndroidSigning(env = {}) {
  const values = SIGNING_ENV_KEYS.map((key) => String(env[key] || '').trim());
  const given = values.filter(Boolean).length;
  if (given === 0) return { mode: 'debug' };
  if (given !== SIGNING_ENV_KEYS.length) {
    const missing = SIGNING_ENV_KEYS.filter((_, index) => !values[index]);
    throw new Error(`Android 签名环境变量不完整，缺少：${missing.join(', ')}`);
  }
  const [storeFile, storePassword, keyAlias, keyPassword] = values;
  return { mode: 'release', keystore: { storeFile, storePassword, keyAlias, keyPassword } };
}

/** 生成 android/keystore.properties 的内容（此文件不进版本库）。 */
export function buildKeystoreProperties({ storeFile, storePassword, keyAlias, keyPassword }) {
  return [
    `storeFile=${storeFile}`,
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    ''
  ].join('\n');
}

/**
 * 往 `cap add android` 生成的 app/build.gradle 注入正式签名配置。
 * 幂等：已经注入过（含 keystoreProperties 标记）就原样返回，重复执行不会叠加。
 */
export function injectSigningConfig(source) {
  if (source.includes('keystoreProperties')) return source;

  const header = [
    'def keystoreProperties = new Properties()',
    "def keystorePropertiesFile = rootProject.file('keystore.properties')",
    'if (keystorePropertiesFile.exists()) {',
    '    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))',
    '}',
    ''
  ].join('\n');

  const signingConfigs = [
    '    signingConfigs {',
    '        release {',
    "            storeFile file(keystoreProperties['storeFile'])",
    "            storePassword keystoreProperties['storePassword']",
    "            keyAlias keystoreProperties['keyAlias']",
    "            keyPassword keystoreProperties['keyPassword']",
    '        }',
    '    }'
  ].join('\n');

  let output = `${header}\n${source}`;

  if (!/buildTypes\s*\{/.test(output)) {
    throw new Error('app/build.gradle 缺少 buildTypes 块，无法注入签名配置');
  }
  output = output.replace(/android\s*\{/, (match) => `${match}\n${signingConfigs}`);
  output = output.replace(
    /buildTypes\s*\{\s*release\s*\{/,
    (match) => `${match}\n            signingConfig signingConfigs.release`
  );
  return output;
}
