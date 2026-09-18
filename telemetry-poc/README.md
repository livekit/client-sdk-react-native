# Telemetry PoC (React Native)

The React Native half of the design in `client-sdk-js`'s `TELEMETRY.md`. `src/telemetry/index.ts`
is a **verbatim copy** of the file that runs in the browser — the point of the PoC is that it needs
no fork: no DOM, no `crypto.getRandomValues`, no `TextEncoder` on the protobuf path, and a binary
body that React Native's `convertRequestBody` base64s over the bridge.

A bare RN 0.82.1 app rather than the repo's `example/`: the question is whether the module runs on
Hermes and reaches a collector, and WebRTC has nothing to do with that.

## Without a simulator

Metro bundles it and the real Hermes VM runs it, with `fetch` stubbed to print what the transport
would send:

```sh
npx react-native bundle --platform ios --dev false --entry-file hermes-check.js --bundle-output /tmp/hermes-check.js
./node_modules/react-native/sdks/hermesc/osx-bin/hermes -O -w /tmp/hermes-check.js
```

```
POST http://127.0.0.1:4320/v1/logs application/x-protobuf 326 bytes keepalive=true
POST http://127.0.0.1:4320/v1/logs application/json      846 bytes keepalive=true
```

Same record, same package: protobuf is 2.6× smaller than JSON.

## On the simulator

```sh
otelcol-contrib --config ../../client-sdk-js-telemetry/src/telemetry/otelcol-web.yaml   # :4320
npx react-native start
npx react-native run-ios
```

The iOS simulator shares the host's network stack, so `127.0.0.1` is the Mac and ATS allows it
(`NSAllowsLocalNetworking`). Two buttons, one ping each.

`react-native run-ios` fails on Xcode 26/27 (it opens a `Simulator.app` that no longer lives under
`Contents/Developer/Applications`); build with `xcodebuild -workspace ios/TelemetryPoC.xcworkspace
-scheme TelemetryPoC -sdk iphonesimulator` and install with `xcrun simctl` instead. The pods need
one patch on this toolchain: fmt 11.0.2, which React Native 0.82 pins, does not compile under the
current clang ("call to consteval function … is not a constant expression", fixed in fmt 11.1) —
`#if FMT_USE_CONSTEVAL` → `#if 0` in `ios/Pods/fmt/include/fmt/base.h`. Neither has anything to do
with telemetry.
