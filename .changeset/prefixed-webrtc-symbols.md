---
'@livekit/react-native': major
---

Move to the LiveKit prefixed WebRTC builds: `io.github.webrtc-sdk:android-prefixed` on Android and the `LiveKitWebRTC` pod on iOS. This prevents collisions against any other WebRTC implementations.

<<<<<<< HEAD
Apps that only use the JavaScript API need no other changes. Native integrations must migrate to the prefixed symbols: `org.webrtc.*` becomes `livekit.org.webrtc.*` on Android, and libwebrtc Objective-C types gain an `LK` prefix on iOS (`RTCAudioRenderer` becomes `LKRTCAudioRenderer`, `RTCAudioBuffer` becomes `LKRTCAudioBuffer`, and so on). Custom `-keep class org.webrtc.**` ProGuard rules must be updated to `livekit.org.webrtc.**`.
=======
Apps that only use the JavaScript API need no changes. 

Native integrations must migrate to the prefixed symbols: 

* Android: `org.webrtc.*` becomes `livekit.org.webrtc.*`.  
  Custom `-keep class org.webrtc.**` ProGuard rules must be updated to `livekit.org.webrtc.**`.
* iOS: types gain an `LK` prefix (`RTCAudioRenderer` becomes `LKRTCAudioRenderer`, `RTCAudioBuffer` becomes `LKRTCAudioBuffer`, and so on). 
>>>>>>> fd23666 (audio changes and cleanup)
