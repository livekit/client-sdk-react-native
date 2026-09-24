---
'@livekit/react-native': minor
---

Client telemetry: `registerGlobals` now names the platform to `livekit-client`'s telemetry pipeline, flushes it when the app leaves the foreground, and gives it a write-ahead cache backed by a directory of files (`LKBatchStore.swift`, `BatchStore.kt`) mirroring the Rust core's `FileCache` — so a session that ends with the app being killed, or an hour spent offline, replays at the next launch instead of being lost. Thermal state, low power mode and memory pressure are read natively and reported as the events SPEC names, stretching the upload cadence under pressure.
