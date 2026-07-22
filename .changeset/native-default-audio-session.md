---
'@livekit/react-native': minor
---

Configure the iOS audio session natively in the default path, removing the audio engine's JS round trip and its deadlock window. Deprecate the unsafe `onConfigureNativeAudio` callback form of `setupIOSAudioManagement`. Developers can instead pass in a static `IOSAudioSessionPolicy`.
