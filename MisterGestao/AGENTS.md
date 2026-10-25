This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

The project uses npm. Use the Expo CLI for Expo-compatible dependency installation.

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npm run lint                # lint
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

The app is JavaScript-only; do not add TypeScript files or TypeScript configuration. Run lint before declaring implementation work done.

## Navigation & Routing

- Use **React Navigation** for navigation. `src/app/AppNavigator.js` handles the session and authenticated stack; `src/app/MainTabsNavigator.js` registers Hoje (Home), Produtos, Orçamentos and Venda. Product registration opens above the tabs. This is not an Expo Router routes directory.
- Screens receive the React Navigation `navigation` prop; never import Expo Router APIs.
- Navigation docs: https://reactnavigation.org/docs/getting-started/

## Firebase and products

- Reuse the singleton app in `src/services/firebase.js` and auth in `src/services/auth.js` (Metro selects `auth.native.js` on native platforms).
- Products are in Firestore under `lojas/mister-motoplace/produtos`; shared reads live in `src/context/ProductsContext.js`.
- Keep product access authenticated: per Pandini's decision, any signed-in account may read and create products, without membership documents or roles. Do not require per-user authorization.
- Read `../docs/FIREBASE.md` before changing Firestore fields, collection paths or security rules.
- Do not write passwords, `.env` contents, service account keys or other credentials to chat or tracked files.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
