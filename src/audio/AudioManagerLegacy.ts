/**
 * Backward-compatible wrappers for the legacy AudioManager API.
 *
 * These exports preserve the old `useIOSAudioManagement(room, ...)` signature
 * and the removed `getDefaultAppleAudioConfigurationForMode` function so that
 * existing consumers continue to compile without changes.
 *
 * New code should use `setupIOSAudioManagement` from `./AudioManager` instead.
 */
import { useEffect } from 'react';
import type { Room } from 'livekit-client';
import type { AppleAudioConfiguration, AudioTrackState } from './AudioSession';
import {
  setupIOSAudioManagement,
  type AudioEngineConfigurationState,
} from './AudioManager';

/**
 * @deprecated Use {@link setupIOSAudioManagement} instead.
 *   The `room` parameter is ignored — audio session is now managed
 *   via audio engine events, not room track counts.
 */
export function useIOSAudioManagement(
  room: Room,
  preferSpeakerOutput: boolean = true,
  onConfigureNativeAudio?: (
    trackState: AudioTrackState,
    preferSpeakerOutput: boolean
  ) => AppleAudioConfiguration
) {
  useEffect(() => {
    let wrappedOnConfig:
      | ((state: AudioEngineConfigurationState) => AppleAudioConfiguration)
      | undefined;

    if (onConfigureNativeAudio) {
      const legacyCb = onConfigureNativeAudio;
      wrappedOnConfig = (state: AudioEngineConfigurationState) =>
        legacyCb(engineStateToTrackState(state), state.preferSpeakerOutput);
    }

    const cleanup = setupIOSAudioManagement(
      preferSpeakerOutput,
      wrappedOnConfig
    );
    return cleanup;
  }, [preferSpeakerOutput, onConfigureNativeAudio]);
}

/**
 * @deprecated Use the default behavior of `setupIOSAudioManagement` instead.
 */
export function getDefaultAppleAudioConfigurationForMode(
  mode: AudioTrackState,
  preferSpeakerOutput: boolean = true
): AppleAudioConfiguration {
  if (mode === 'remoteOnly') {
    return {
      audioCategory: 'playback',
      audioCategoryOptions: ['mixWithOthers'],
      audioMode: 'spokenAudio',
    };
  } else if (mode === 'localAndRemote' || mode === 'localOnly') {
    return {
      audioCategory: 'playAndRecord',
      audioCategoryOptions: ['allowBluetooth', 'mixWithOthers'],
      audioMode: preferSpeakerOutput ? 'videoChat' : 'voiceChat',
    };
  }

  return {
    audioCategory: 'soloAmbient',
    audioCategoryOptions: [],
    audioMode: 'default',
  };
}

function engineStateToTrackState(
  state: AudioEngineConfigurationState
): AudioTrackState {
  if (state.isRecordingEnabled && state.isPlayoutEnabled) {
    return 'localAndRemote';
  } else if (state.isRecordingEnabled) {
    return 'localOnly';
  } else if (state.isPlayoutEnabled) {
    return 'remoteOnly';
  }
  return 'none';
}
