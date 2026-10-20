#!/usr/bin/env bash
# Generates the Android project from capacitor.config.ts and applies Eggshells' release settings.
# Run from the repo root after `npm run build`. Used by Codemagic; also works locally.
set -euo pipefail

npx cap add android
npx @capacitor/assets generate --android

MANIFEST=android/app/src/main/AndroidManifest.xml
APP_GRADLE=android/app/build.gradle

# Nothing the app stores should leave the phone through Android backups.
# (-i.bak works with both GNU and macOS sed)
sed -i.bak 's/android:allowBackup="true"/android:allowBackup="false"/' "$MANIFEST"
rm -f "$MANIFEST.bak"

# Google Play needs a higher versionCode on every upload. Codemagic provides BUILD_NUMBER.
if [ -n "${BUILD_NUMBER:-}" ]; then
  sed -i.bak -E "s/versionCode [0-9]+/versionCode ${BUILD_NUMBER}/" "$APP_GRADLE"
  rm -f "$APP_GRADLE.bak"
fi

npx cap sync android

echo "targetSdk check:"
grep -n "targetSdkVersion\|compileSdkVersion\|minSdkVersion" android/variables.gradle
