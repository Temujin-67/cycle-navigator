# Eggshells: Know Where to Step

A tongue-in-cheek, day-by-day guide to her cycle, for men. Next.js (static export) wrapped with Capacitor for iOS and Android.
Everything the user enters stays on the device; there is no backend.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
```

## Mobile

```bash
npm run cap:sync   # build web + copy into the native projects
```

- Native projects are generated, not committed: `npm run native:android` / `npm run native:ios`.
- App ID (iOS and Android): `com.damsstudios.eggshells`
- Icons: source images live in `assets/`; `npx @capacitor/assets generate` creates all sizes.
- Store listing images: `store-assets/`
- CI: `codemagic.yaml` (Android debug APK, iOS release to TestFlight)
- Name, publisher and support email: `src/lib/site.ts`
