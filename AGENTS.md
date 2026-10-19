# LiveKit React Native SDK

React Native wrapper (`@livekit/react-native`) that makes [`livekit-client`](https://github.com/livekit/client-sdk-js) work on React Native by providing WebRTC via `@livekit/react-native-webrtc`, browser API polyfills, and native audio session management for iOS/Android.

## Commands

Package manager: yarn 4 (Corepack), Node >= 20. Workspaces: root + `example`.

```sh
yarn bootstrap        # install root + example deps and pods
yarn typescript       # typecheck (tsc --noemit)
yarn lint             # eslint (use --fix to autofix)
yarn test             # jest
yarn prepare          # build the library with react-native-builder-bob
yarn build-docs       # typedoc (CI treats warnings as errors)
yarn example android  # run the example app
yarn example ios
```

The pre-commit hook runs `yarn lint && yarn typescript`. CI additionally compiles the native code through the standalone RN app in `ci/` (`ci/android`, `ci/ios`) — pure TS changes don't need it locally, but native changes should build there and be tested on both platforms.

## Repo layout

- `src/` — TypeScript source; entry point `src/index.tsx`. Subdirs: `audio/`, `components/`, `e2ee/`, `events/`, `hooks/`, `polyfills/`.
- `android/`, `ios/` — native modules (Kotlin / Swift+ObjC); mostly audio session management, audio processing, and video codec factories. Podspec: `livekit-react-native.podspec`.
- `example/` — bare RN example app (yarn workspace, not Expo).
- `ci/` — minimal RN app used only for native compile checks in CI.
- `docs/` — generated typedoc output; do not edit by hand.

Expo support lives in a separate repo: [client-sdk-react-native-expo-plugin](https://github.com/livekit/client-sdk-react-native-expo-plugin).

## Architecture

- `registerGlobals()` (`src/index.tsx`) must be called by apps before any LiveKit usage: it registers WebRTC globals, installs polyfills (URL, web streams, `crypto.randomUUID`, etc.), sets up iOS audio management, and wires native events.
- Polyfill import order at the top of `src/index.tsx` matters — `MediaRecorderShim` must stay after the others because it transitively imports `livekit-client`. `src/polyfills/` is excluded from linting.
- Room/participant/track logic lives in `livekit-client` (peer dependency); this repo contributes hooks/components, audio session APIs (`AudioSession`, `audio/AudioManager`), E2EE key providers, and native event plumbing (`src/events/`).
- `@livekit/react-native-webrtc` and `livekit-client` are peer dependencies — version bumps must keep the ranges in `package.json` in sync with what the SDK actually requires.

## Common pitfalls (from issue history)

- iOS audio session handling is the most frequent source of user-reported bugs (conflicts with other audio libraries, mute/unmute side effects, routing). Change `AudioSession` / native audio code conservatively and test on device.
- Importing `livekit-client` (directly or transitively) before `registerGlobals()` runs breaks apps at runtime on Hermes — watch for this when adding imports to `src/index.tsx` or the polyfills.
- The `exports` map in `package.json` is load-bearing: past mistakes caused Metro to bundle duplicate instances of `@livekit/components-react`, breaking `RoomContext`. Treat packaging changes as high-risk.

## Error-prone areas & anti-patterns (from bug/review history)

Bridge and native lifecycle:

- Never let a real-time native thread round-trip through JS. Audio-engine callbacks used to call into JS and deadlocked whenever the JS thread was blocked; they are handled natively now. Keep `@ReactMethod`s async (`isBlockingSynchronousMethod` was tried and reverted) — anything a native thread needs must be resolvable without JS.
- Native resources held by Kotlin singletons must survive React-instance reloads: whatever `setup()` creates, the module's `invalidate()` must release/recreate (a `lateinit` ADM once crashed every dev-menu reload). Reload is a first-class test case.
- Collections touched from WebRTC audio threads need synchronization (`android/.../audio/processing/AudioSinkManager.kt` shows the pattern). Also beware discarded results — a `filterNot` whose return value was ignored made `unregisterSink` a silent no-op.
- iOS: keep audio-session *configuration* separate from *activation* — `setActive` belongs only in `startAudioSession`/`stopAudioSession`, and the SDK must not activate the session when there's no call. Never expose the Swift bridging header through public/umbrella headers, and test both static and dynamic framework linkage.

Hooks and state:

- Don't reconstruct native/room state by incrementally counting events into React state — the old track-counting audio management drifted repeatedly before being replaced with native ADM events. Subscribe to the source of truth or derive from room objects.
- Watch effect/memo dependencies: a default parameter like `options = {}` is a fresh object every render and caused an infinite rerender loop. Extract primitive deps; pair every native `create*Processor` call with its `delete*` in the effect cleanup; key native resources by track *and* peer connection id (track id alone gave wrong volumes with multiple peer connections).
- Reserve the `use` prefix for real hooks; one-shot setup functions get `setup*` names.
- Don't type the react-native-webrtc boundary as `any`/`@ts-ignore` — an untyped `mediaStreamTrack` hid a real bug.

Polyfills and API surface:

- Bumping `livekit-client` routinely surfaces new missing web APIs on Hermes — audit what it newly calls. Never infer one global from another (RN once shipped `TextEncoder` without `TextDecoder`), and never shim `document`: libraries feature-detect on it and assume a full DOM.
- Don't change the behavior of an existing public API — add a new method and deprecate the old one.

## Code style

- Prettier (single quotes, 2-space indent, es5 trailing commas) enforced through ESLint; config in `eslint.config.mjs`.
- TypeScript is `strict` with `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` — new code must compile clean, no `any` escapes.
- Commit messages: conventional-commit style prefixes (`fix:`, `chore:`) are common but not enforced.

## Releases

Uses [Changesets](https://github.com/changesets/changesets). Every user-facing change needs a changeset (`yarn changeset`); releases are published from `main` by the Release workflow.
