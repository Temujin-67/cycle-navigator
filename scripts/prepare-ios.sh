#!/usr/bin/env bash
# Generates the iOS project from capacitor.config.ts. Run from the repo root after `npm run build`.
set -euo pipefail

# CocoaPods keeps the App.xcworkspace layout that codemagic.yaml expects.
npx cap add ios --packagemanager CocoaPods
npx @capacitor/assets generate --ios

PLIST=ios/App/App/Info.plist
# The app uses no encryption of its own, so skip the export-compliance question on every upload.
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption false" "$PLIST"

# App Store Connect needs a higher build number on every upload.
if [ -n "${BUILD_NUMBER:-}" ]; then
  (cd ios/App && agvtool new-version -all "${BUILD_NUMBER}")
fi

npx cap sync ios
