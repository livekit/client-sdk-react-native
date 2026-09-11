---
'@livekit/react-native': minor
---

iOS: pick the audio session mode based on Apple Voice Processing I/O state.

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
