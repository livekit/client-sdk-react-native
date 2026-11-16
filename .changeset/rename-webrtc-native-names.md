---
'@livekit/react-native': minor
---

Update `@livekit/react-native-webrtc` to 150.2.0, which renames its native classes so it can be installed in the same app as other react-native-webrtc forks.

Update both packages together: this release doesn't build against earlier `@livekit/react-native-webrtc` versions, and earlier releases of this package don't build against 150.2.0. Expo users also need to update the [Expo plugin](https://github.com/livekit/client-sdk-react-native-expo-plugin).

If your app uses any of these native names, switch to the new ones:
- iOS: classes and their headers gain an `LKRN` prefix. The Objective-C setup imports `WebRTCModuleOptions.h` in `AppDelegate`; change it to `#import "LKRNWebRTCModuleOptions.h"`. Use `LKRNWebRTCModuleOptions` in place of `WebRTCModuleOptions`, in Swift too.
- iOS screen sharing: open the broadcast picker with `NativeModules.LKRNScreenCapturePickerViewManager.show(reactTag)` instead of `NativeModules.ScreenCapturePickerViewManager.show(reactTag)`.
- Android: `com.oney.WebRTCModule.*` becomes `io.livekit.reactnative.webrtc.*`. Class names are unchanged, so `WebRTCModuleOptions` is now `io.livekit.reactnative.webrtc.WebRTCModuleOptions`.
