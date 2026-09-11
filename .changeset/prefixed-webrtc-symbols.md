---
'@livekit/react-native': major
---

Move to the LiveKit prefixed WebRTC builds: `io.github.webrtc-sdk:android-prefixed` on Android and the `LiveKitWebRTC` pod on iOS. This prevents collisions against any other WebRTC implementations.

Apps that only use the JavaScript API need no changes. 

Native integrations must migrate to the prefixed symbols: 

* Android: `org.webrtc.*` becomes `livekit.org.webrtc.*`.  
  Custom `-keep class org.webrtc.**` ProGuard rules must be updated to `livekit.org.webrtc.**`.
* iOS: types gain an `LK` prefix (`RTCAudioRenderer` becomes `LKRTCAudioRenderer`, `RTCAudioBuffer` becomes `LKRTCAudioBuffer`, and so on). 
