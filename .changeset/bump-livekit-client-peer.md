---
'@livekit/react-native': patch
---

Require `livekit-client` ^2.20.0. Earlier 2.19.x releases pre-allocate media sections in single peer connection mode, which React Native's libwebrtc doesn't support, causing remote tracks to never be subscribed or render black (livekit/client-sdk-js#1977, livekit/client-sdk-js#2113).
