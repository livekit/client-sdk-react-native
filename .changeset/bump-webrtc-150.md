---
'@livekit/react-native': minor
---

Update @livekit/react-native-webrtc to 150.1.0.

iOS: the `LiveKitWebRTC` pod is published to the [livekit/podspecs](https://github.com/livekit/podspecs) spec repo and the CocoaPods trunk. The CocoaPods trunk stops accepting new pods on December 2, 2026, so later `LiveKitWebRTC` versions will only be available from livekit/podspecs. Add both sources to the top of your `ios/Podfile`:

```ruby
source 'https://github.com/livekit/podspecs.git'
source 'https://cdn.cocoapods.org/'
```

Keep the `cdn.cocoapods.org` line: once a `Podfile` lists any `source`, CocoaPods stops using trunk by default, and your other pods still come from there.

Expo users don't need to edit the `Podfile` by hand: version 1.1.0 and later of the [Expo plugin](https://github.com/livekit/client-sdk-react-native-expo-plugin) adds these sources during prebuild.

If `pod install` then reports that it could not find compatible versions for `LiveKitWebRTC`, run `cd ios && pod update LiveKitWebRTC`.
