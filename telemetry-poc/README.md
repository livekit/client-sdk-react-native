# Telemetry PoC (React Native)

Exercises the integrated pipeline on a device runtime: the real `livekit-client` build with
telemetry inside it (`src/telemetry/` there, designed in its `TELEMETRY.md`), plus this SDK's own
`src/telemetry.ts` seam, which names the platform and flushes when the app leaves the foreground.

A bare RN 0.82.1 app rather than the repo's `example/`: what is under test is whether the module
runs on Hermes, reads the device, and reaches a collector. It does link this package's pod, so the
native device-state code is the real thing. A full RN *session* — connect, tracks, stats windows —
needs the example app, and is the next step.

Metro resolves `../src/telemetry` (this repo's source) and `livekit-client` from a local checkout,
so `metro.config.js` watches the folder above and pins both packages plus `@babel/runtime` to this
app's copies. The dependency is `file:../../client-sdk-js-telemetry`, i.e. the sibling worktree.

## Running it

```sh
otelcol-contrib --config ../../client-sdk-js-telemetry/src/telemetry/otelcol-web.yaml   # :4320
npx react-native start
xcrun simctl launch "iPhone 16 Pro" org.reactjs.native.example.TelemetryPoC
```

The app pings on mount and on tap. What lands in the collector, all with
`service.name=livekit-client-react-native service.version=3.0.0 os.name=ios os.version=18.6`:

```
lk.device.app_state.changed   lk.device.app_state=foreground
lk.ping                       lk.ping.seq=1
```

Thermal state, low power mode and memory pressure are **not** in that list any more, and that is
the design: React Native follows the phones, so those go to the Rust core natively
(`LKDeviceState.swift`, `DeviceStateMonitor.kt`) and never pass through JavaScript. Until the core
is bound here, the monitors have no consumer — they were verified reaching the collector through a
temporary JS bridge (`thermal=nominal`, `lowPower=false`) before that bridge was removed. Memory
pressure was never exercised: the simulator gives no way to drive `DispatchSource`'s levels.

## The file cache

`src/telemetryStorage.ts` gives `livekit-client`'s pipeline a `TelemetryStorage` backed by
`LKBatchStore.swift` / `BatchStore.kt` — a directory of batch files mirroring the Rust core's
`FileCache`. Proved on the simulator: with the collector down the app cached 36 batches to
`Library/Caches/livekit-telemetry`, was killed from `simctl`, and on relaunch with the collector
back delivered all 45 records, including the 35 per-tick self-reports that reconstruct the offline
period after the fact.

## Where this is heading

The caching semantics of the native SDKs are here now, without Rust. If the bigger question ever
resolves the other way — React Native binding the core through UniFFI for the whole pipeline —
`livekit-client` already has the seam for it (`src/telemetry/backend.ts`, SPEC's typed surface),
and `Telemetry.setBackend` is where it would plug in. Nothing done here forecloses that.

## What this found

**An event sent from inside a native method races the listener.** `startDeviceStateUpdates` first
sent the device snapshot with `sendEvent`, and it never arrived: JS registers the listener around
the same call, and `RCTEventEmitter` drops an event with no listeners (natively — `console.warn`
never sees it, so the app shows "Open debugger to view warnings" and nothing else). The first state
now comes back on the method's promise, and only later changes are events.

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
