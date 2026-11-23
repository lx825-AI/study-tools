/**
 * semver → Android versionCode 的单元测试（node --test，不需要 Android SDK）。
 */
import test from 'node:test';
import assert from 'node:assert';

import { semverToVersionCode } from '../scripts/version-code.mjs';

test('三位版本号按 major*10000 + minor*100 + patch 换算', () => {
  assert.strictEqual(semverToVersionCode('1.0.0'), 10000);
  assert.strictEqual(semverToVersionCode('1.2.3'), 10203);
  assert.strictEqual(semverToVersionCode('2.0.1'), 20001);
  assert.strictEqual(semverToVersionCode('0.1.0'), 100);
});

test('缺位补 0，多余段忽略', () => {
  assert.strictEqual(semverToVersionCode('1'), 10000);
  assert.strictEqual(semverToVersionCode('1.2'), 10200);
  assert.strictEqual(semverToVersionCode('1.2.3.4'), 10203);
});

test('非法片段按 0 处理，不抛异常', () => {
  assert.strictEqual(semverToVersionCode('1.x.3'), 10003);
  assert.strictEqual(semverToVersionCode(''), 0);
});
