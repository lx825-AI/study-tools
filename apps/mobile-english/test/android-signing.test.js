import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SIGNING_ENV_KEYS,
  buildKeystoreProperties,
  injectSigningConfig,
  resolveAndroidSigning
} from '../scripts/android-signing.mjs';

test('没有签名环境变量时退回调试签名', () => {
  assert.deepEqual(resolveAndroidSigning({}), { mode: 'debug' });
  assert.deepEqual(resolveAndroidSigning({ OTHER: 'x' }), { mode: 'debug' });
});

test('四个变量齐全时使用正式签名', () => {
  const env = {
    ANDROID_KEYSTORE_FILE: '/tmp/release.keystore',
    ANDROID_KEYSTORE_PASSWORD: 'store-pass',
    ANDROID_KEY_ALIAS: 'study-tools',
    ANDROID_KEY_PASSWORD: 'key-pass'
  };
  const result = resolveAndroidSigning(env);
  assert.equal(result.mode, 'release');
  assert.deepEqual(result.keystore, {
    storeFile: '/tmp/release.keystore',
    storePassword: 'store-pass',
    keyAlias: 'study-tools',
    keyPassword: 'key-pass'
  });
});

test('只配一部分时报错并点出缺哪些变量', () => {
  assert.throws(
    () => resolveAndroidSigning({ ANDROID_KEYSTORE_FILE: '/tmp/release.keystore' }),
    (err) => {
      assert.match(err.message, /ANDROID_KEYSTORE_PASSWORD/);
      assert.match(err.message, /ANDROID_KEY_ALIAS/);
      assert.match(err.message, /ANDROID_KEY_PASSWORD/);
      assert.ok(!err.message.includes('缺少：ANDROID_KEYSTORE_FILE'));
      return true;
    }
  );
});

test('keystore.properties 按 Gradle 需要的键名输出', () => {
  const content = buildKeystoreProperties({
    storeFile: '/tmp/release.keystore',
    storePassword: 'store-pass',
    keyAlias: 'study-tools',
    keyPassword: 'key-pass'
  });
  assert.deepEqual(content.trimEnd().split('\n'), [
    'storeFile=/tmp/release.keystore',
    'storePassword=store-pass',
    'keyAlias=study-tools',
    'keyPassword=key-pass'
  ]);
});

const TEMPLATE = `apply plugin: 'com.android.application'

android {
    namespace "com.getcapacitor.myapp"
    defaultConfig {
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
        }
    }
}
`;

test('注入签名配置后 release 指向 signingConfigs.release', () => {
  const output = injectSigningConfig(TEMPLATE);
  assert.match(output, /def keystoreProperties = new Properties\(\)/);
  assert.match(output, /signingConfigs \{\n {8}release \{/);
  assert.match(output, /buildTypes \{\n {8}release \{\n {12}signingConfig signingConfigs\.release/);
  assert.match(output, /versionCode 1/);
});

test('重复注入是幂等的', () => {
  const once = injectSigningConfig(TEMPLATE);
  const twice = injectSigningConfig(once);
  assert.equal(twice, once);
});

test('缺少 buildTypes 块时给出明确错误', () => {
  assert.throws(() => injectSigningConfig('android {\n}\n'), /缺少 buildTypes/);
});

test('变量清单与该模块导出一致', () => {
  assert.deepEqual(SIGNING_ENV_KEYS, [
    'ANDROID_KEYSTORE_FILE',
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEY_PASSWORD'
  ]);
});
