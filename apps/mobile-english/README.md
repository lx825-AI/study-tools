# mobile-english

Capacitor 7 壳，把 `web/English-web/dist` 打进 Android 工程，产出 APK。

```bash
# 先在仓库根构建 web（或 npm run build:english）
npm install
npm run android    # 拷 dist → www/，首次会 npx cap add android，然后 gradlew assembleDebug
# 产物：dist-apps/flashcard-<版本>-android.apk（VERSION 环境变量控制版本，默认 1.0.0）
```

- 需要 JDK 21 + Android SDK（`platforms;android-35`、`build-tools;35.0.0`）；没有本机工具链时交给 `.github/workflows/release.yml`。
- `www/` 与 `android/` 都是生成物，不入库。
- `versionCode = major*10000 + minor*100 + patch`，由 `scripts/build-android.mjs` 计算。
- 四个签名变量齐全时产出 release 签名包（CI 用仓库固定 keystore），可直接覆盖安装；未配置时退回 Gradle debug 签名，只能侧载。上架应用商店需按商店要求另配。
- 应用内页面与网页版一致；Service Worker 在 Capacitor 的 `https://` 本地服务下不注册，离线能力来自打包在 APK 内的资源。
