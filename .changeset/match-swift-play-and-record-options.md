---
'@livekit/react-native': minor
---

iOS: align the default `playAndRecord` presets with the LiveKit Swift SDK.

The duplex (recording) presets now request `mixWithOthers`, `allowBluetooth`,
`allowBluetoothA2DP` and `allowAirPlay`, matching `playAndRecordOptions` in the
Swift SDK. Previously only `allowBluetooth` and `mixWithOthers` were requested,
so A2DP output devices and AirPlay routes were unavailable during a call on this
platform but available on others.

When `preferSpeakerOutput` is set, `defaultToSpeaker` is now requested as well.
The `videoChat` mode implies a speaker route, but iOS may rewrite the mode when
Voice Processing I/O is instantiated - the Swift SDK observed it switching to
`voiceChat`, which routes to the receiver. Requesting the option explicitly
keeps the speaker route across that rewrite.

This affects the defaults used by `setupIOSAudioManagement` and the deprecated
`getDefaultAppleAudioConfigurationForMode`. A custom `IOSAudioSessionPolicy` or
`AppleAudioConfiguration` is unaffected - those supply their own options.
