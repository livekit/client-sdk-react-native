---
'@livekit/react-native': major
---

Move to the prefixed WebRTC builds: `io.github.webrtc-sdk:android-prefixed` on Android and the `LiveKitWebRTC` pod on iOS.

iOS apps must add the LiveKit podspec source to their `Podfile`, since `LiveKitWebRTC` is not published on the CocoaPods trunk:

```ruby
source 'https://cdn.cocoapods.org/'
source 'https://github.com/livekit/podspecs.git'
```

Apps that only use the JavaScript API need no other changes. Native integrations must migrate to the prefixed symbols: `org.webrtc.*` becomes `livekit.org.webrtc.*` on Android, and libwebrtc Objective-C types gain an `LK` prefix on iOS (`RTCAudioRenderer` becomes `LKRTCAudioRenderer`, `RTCAudioBuffer` becomes `LKRTCAudioBuffer`, and so on). Custom `-keep class org.webrtc.**` ProGuard rules must be updated to `livekit.org.webrtc.**`.
