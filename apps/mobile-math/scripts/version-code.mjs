/**
 * Android 版本号换算：semver → versionCode。
 *
 * 规则：major * 10000 + minor * 100 + patch，缺位按 0 处理。
 * 单独成模块是为了能在没有 Android SDK 的环境里单测（CI 的 apps job 会跑）。
 */
export function semverToVersionCode(version) {
  const [major = 0, minor = 0, patch = 0] = String(version)
    .split('.')
    .map((part) => parseInt(part, 10) || 0);
  return major * 10000 + minor * 100 + patch;
}
