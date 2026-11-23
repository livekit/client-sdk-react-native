---
'@livekit/react-native': patch
---

Android: port AudioSwitchHandler improvements from client-sdk-android. Audio routing now runs on a dedicated background thread, uses the communication device API on Android 12+, fixes a race where a quick stop/start could leave audio stuck on the earpiece, and releases the audio session on React reload.
