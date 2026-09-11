# @livekit/react-native

## 3.0.0

### Major Changes

- Move to the LiveKit prefixed WebRTC builds: `io.github.webrtc-sdk:android-prefixed` on Android and the `LiveKitWebRTC` pod on iOS. This prevents collisions against any other WebRTC implementations. - [#455](https://github.com/livekit/client-sdk-react-native/pull/455) ([@davidliu](https://github.com/davidliu))

  Apps that only use the JavaScript API need no changes.

  Native integrations must migrate to the prefixed symbols:
  - Android: `org.webrtc.*` becomes `livekit.org.webrtc.*`.
    Custom `-keep class org.webrtc.**` ProGuard rules must be updated to `livekit.org.webrtc.**`.
  - iOS: types gain an `LK` prefix (`RTCAudioRenderer` becomes `LKRTCAudioRenderer`, `RTCAudioBuffer` becomes `LKRTCAudioBuffer`, and so on).

### Minor Changes

- iOS: align the default `playAndRecord` presets with the LiveKit Swift SDK. - [#455](https://github.com/livekit/client-sdk-react-native/pull/455) ([@davidliu](https://github.com/davidliu))

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

- iOS: pick the audio session mode based on Apple Voice Processing I/O state. - [#455](https://github.com/livekit/client-sdk-react-native/pull/455) ([@davidliu](https://github.com/davidliu))

  iOS applies a reduced, call-tuned speaker gain while capture is active under the
  `voiceChat`/`videoChat` session modes. Apple Voice Processing I/O compensates
  with its own loudness stage, so with VPIO off remote audio played back
  noticeably quieter.

  `LiveKitWebRTC` 144.7559.15 reports the resolved VPIO state to the audio device
  module's `willEnableEngine` hook. The default recording configuration now uses
  that: with VPIO running it keeps `voiceChat`/`videoChat` as before, and with VPIO
  off (for example after `AudioDeviceModule.setVoiceProcessingEnabled(false)`) it
  switches to the `default` mode, which keeps media gain. That mode routes to the
  receiver, so `preferSpeakerOutput` is expressed through the `defaultToSpeaker`
  category option instead of the implicit routing the chat modes provide. This
  matches what the LiveKit Swift SDK already does.

  `IOSAudioSessionPolicy` gains an optional `recordingWithoutVoiceProcessing`
  configuration for the VPIO-off case. Policies that omit it keep using their
  `recording` configuration for both, so existing setups are unaffected.
  `AudioEngineConfigurationState`, passed to the deprecated
  `setupIOSAudioManagement` callback form, gains a matching
  `isVoiceProcessingEnabled` field.

  Requires `@livekit/react-native-webrtc` with the five-argument `willEnableEngine`
  delegate method. Older versions crash with an unrecognized selector when the
  audio engine first enables.

## 2.12.0

### Minor Changes

- Configure the iOS audio session natively in the default path, removing the audio engine's JS round trip and its deadlock window. Deprecate the unsafe `onConfigureNativeAudio` callback form of `setupIOSAudioManagement`. Developers can instead pass in a static `IOSAudioSessionPolicy`. - [#434](https://github.com/livekit/client-sdk-react-native/pull/434) ([@hiroshihorie](https://github.com/hiroshihorie))

### Patch Changes

- Update @livekit/react-native-webrtc to 144.1.2 - [#434](https://github.com/livekit/client-sdk-react-native/pull/434) ([@hiroshihorie](https://github.com/hiroshihorie))

## 2.11.1

### Patch Changes

- Update @livekit/react-native-webrtc to 144.1.1 - [#423](https://github.com/livekit/client-sdk-react-native/pull/423) ([@davidliu](https://github.com/davidliu))

  144.1.0 had an issue which could cause deadlocks when the audio state had changed.

## 2.11.0

### Minor Changes

- Migrate Apple platforms to AVAudioEngine-based audio device module - [#317](https://github.com/livekit/client-sdk-react-native/pull/317) ([@hiroshihorie](https://github.com/hiroshihorie))

### Patch Changes

- Update `@livekit/react-native-webrtc` to 144.1.0 - [#393](https://github.com/livekit/client-sdk-react-native/pull/393) ([@davidliu](https://github.com/davidliu))

- Update `livekit-client` to 2.19.0 - [#391](https://github.com/livekit/client-sdk-react-native/pull/391) ([@davidliu](https://github.com/davidliu))

- Fix incomplete exports map in package.json, causing a dual-instance of @livekit/components and breaking RoomContext - [#351](https://github.com/livekit/client-sdk-react-native/pull/351) ([@davidliu](https://github.com/davidliu))

- Update `web-streams-polyfill` to 4.3.0 - [#391](https://github.com/livekit/client-sdk-react-native/pull/391) ([@davidliu](https://github.com/davidliu))

- Add polyfills for `CountQueuingStrategy` and `TransformStream` for compatibility with livekit-client - [#391](https://github.com/livekit/client-sdk-react-native/pull/391) ([@davidliu](https://github.com/davidliu))

## 2.11.0-beta.1

### Patch Changes

- Fix incomplete exports map in package.json, causing a dual-instance of @livekit/components and breaking RoomContext - [#351](https://github.com/livekit/client-sdk-react-native/pull/351) ([@davidliu](https://github.com/davidliu))

## 2.11.0-beta.0

### Minor Changes

- Migrate Apple platforms to AVAudioEngine-based audio device module - [#317](https://github.com/livekit/client-sdk-react-native/pull/317) ([@hiroshihorie](https://github.com/hiroshihorie))

## 2.10.2

### Patch Changes

- Additional fix for DOMException polyfil - [#346](https://github.com/livekit/client-sdk-react-native/pull/346) ([@davidliu](https://github.com/davidliu))

## 2.10.1

### Patch Changes

- Fix metro warning on invalid path configuration in package.json - [#343](https://github.com/livekit/client-sdk-react-native/pull/343) ([@davidliu](https://github.com/davidliu))

- Polyfill for DOMException to handle usage in livekit-client - [#341](https://github.com/livekit/client-sdk-react-native/pull/341) ([@davidliu](https://github.com/davidliu))

## 2.10.0

### Minor Changes

- Update @livekit/react-native-webrtc to 144.0.0 - [#335](https://github.com/livekit/client-sdk-react-native/pull/335) ([@davidliu](https://github.com/davidliu))
