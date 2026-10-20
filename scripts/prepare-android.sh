#!/usr/bin/env bash
# Generates the Android project from capacitor.config.ts and applies Eggshells' release settings.
# Run from the repo root after `npm run build`. Used by Codemagic; also works locally.
set -euo pipefail

npx cap add android
npx @capacitor/assets generate --android

MANIFEST=android/app/src/main/AndroidManifest.xml
APP_GRADLE=android/app/build.gradle

# Nothing the app stores should leave the phone through Android backups.
sed -i 's/android:allowBackup="true"/android:allowBackup="false"/' "$MANIFEST"

# Google Play needs a higher versionCode on every upload. Codemagic provides BUILD_NUMBER.
if [ -n "${BUILD_NUMBER:-}" ]; then
  sed -i -E "s/versionCode [0-9]+/versionCode ${BUILD_NUMBER}/" "$APP_GRADLE"
fi

npx cap sync android

echo "targetSdk check:"
grep -n "targetSdkVersion\|compileSdkVersion\|minSdkVersion" android/variables.gradle
