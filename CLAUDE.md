# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This is a freshly scaffolded Expo (`blank-typescript` template) React Native app — `App.tsx` still has the
template's placeholder UI. No app-specific architecture, navigation, or data layer exists yet.

## Commands

- `npm start` — start the Expo dev server (Metro); scan the QR code with Expo Go, or press `a`/`i`/`w` to launch
  on Android/iOS/web.
- `npm run android` / `npm run ios` / `npm run web` — start the dev server targeting a specific platform directly.
- `npx tsc --noEmit` — type-check the project. There is no separate `lint` or `test` script configured in
  `package.json` yet.

## Architecture

- Expo managed workflow, SDK 57 (`app.json` under the `expo` key holds app name, icons, and per-platform config
  for iOS/Android/web).
- Entry point: `index.ts` calls `registerRootComponent(App)` from `expo`, which points at the default export of
  `App.tsx`. This registration (rather than a plain `AppRegistry.registerComponent` call) is what makes the same
  entry file work in both Expo Go and native builds.
- `tsconfig.json` extends `expo/tsconfig.base` with `strict: true` enabled — keep new code strict-mode clean.
