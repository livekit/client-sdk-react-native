---
'@livekit/react-native': minor
---

Client telemetry: `registerGlobals` hands `livekit-client`'s telemetry pipeline this platform's resource names, a write-ahead cache backed by a directory of files (`LKBatchStore.swift`, `BatchStore.kt`) so a session that ends with the app being killed replays at the next launch, and the device state a phone can see — app foreground/background, thermal state, low power mode and memory pressure — in the names SPEC uses. `disableTelemetry` is re-exported from `livekit-client`. Requires the first `livekit-client` release that ships the telemetry host seam (`configureTelemetryHost`); the `livekit-client` peer and dev minimum is raised to that release before this ships, and an older `livekit-client` loads without telemetry.
