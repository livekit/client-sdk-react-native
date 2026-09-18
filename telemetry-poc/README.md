# Telemetry PoC (React Native)

Exercises the integrated pipeline on a device runtime: the real `livekit-client` build with
telemetry inside it (`src/telemetry/` there, designed in its `TELEMETRY.md`), plus this SDK's own
`src/telemetry.ts` seam, which names the platform and flushes when the app leaves the foreground.

A bare RN 0.82.1 app rather than the repo's `example/`: what is under test is whether the module
runs on Hermes and reaches a collector, and WebRTC has nothing to do with that. A full RN *session*
— connect, tracks, stats windows — needs the example app, and is the next step.

Metro resolves `../src/telemetry` (this repo's source) and `livekit-client` from a local checkout,
so `metro.config.js` watches the folder above and pins both packages plus `@babel/runtime` to this
app's copies. The dependency is `file:../../client-sdk-js-telemetry`, i.e. the sibling worktree.

## Running it

```sh
otelcol-contrib --config ../../client-sdk-js-telemetry/src/telemetry/otelcol-web.yaml   # :4320
npx react-native start
xcrun simctl launch "iPhone 16 Pro" org.reactjs.native.example.TelemetryPoC
```

The app pings on mount and on tap. What lands in the collector:

```
lk.ping  service.name=livekit-client-react-native service.version=3.0.0 os.name=ios os.version=18.6
```

## What this found

**Import order is load-bearing.** `livekit-client` evaluates `class … extends DOMException` and
`new TextDecoder()` at module scope, and Hermes has neither, so importing it before the polyfills
throws `Property 'DOMException' doesn't exist` — this app's `index.js` imports
`../src/polyfills/DOMException` and `../src/polyfills/EncoderDecoderTogether.min.js` first, exactly
as `src/index.tsx` does. `registerTelemetry` is imported after those in `src/index.tsx` for the
same reason; moving it up would break every app.

## Building it

`react-native run-ios` fails on Xcode 26/27 (it opens a `Simulator.app` that no longer lives under
`Contents/Developer/Applications`), so:

```sh
xcodebuild -workspace ios/TelemetryPoC.xcworkspace -scheme TelemetryPoC \
  -configuration Debug -sdk iphonesimulator -destination 'id=<udid>' -derivedDataPath ios/build
xcrun simctl install "iPhone 16 Pro" ios/build/Build/Products/Debug-iphonesimulator/TelemetryPoC.app
```

The pods need one patch on this toolchain: fmt 11.0.2, which React Native 0.82 pins, does not
compile under the current clang ("call to consteval function … is not a constant expression", fixed
in fmt 11.1) — `#if FMT_USE_CONSTEVAL` → `#if 0` in `ios/Pods/fmt/include/fmt/base.h`. Neither has
anything to do with telemetry.
