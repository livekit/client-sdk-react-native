/**
 * Backward-compatible wrappers for the legacy AudioManager API.
 *
 * These exports preserve the old `useIOSAudioManagement(room, ...)` signature
 * and the removed `getDefaultAppleAudioConfigurationForMode` function so that
 * existing consumers continue to compile without changes.
 *
 * New code should use `setupIOSAudioManagement` from `./AudioManager` instead.
 */
import { useEffect, useRef } from 'react';
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
 *
 *   Note: the `trackState` passed to `onConfigureNativeAudio` is now
 *   derived from the audio engine's playout/recording state, not from
 *   publication counts. Edge cases can differ. For example, a
 *   published-but-muted local audio track that previously yielded
 *   `localOnly` may now appear as `remoteOnly` or `none`. Callers with
 *   nuanced per-state logic should migrate to `setupIOSAudioManagement`.
 */
export function useIOSAudioManagement(
  _room: Room,
  preferSpeakerOutput: boolean = true,
  onConfigureNativeAudio?: (
    trackState: AudioTrackState,
    preferSpeakerOutput: boolean
  ) => AppleAudioConfiguration
) {
  // Hold the latest callback in a ref so its identity doesn't drive the
  // setup effect. Inline-arrow callers would otherwise churn native handlers
  // on every render. Assigned during render so a native event firing between
  // commit and a passive effect still sees the current callback.
  const callbackRef = useRef(onConfigureNativeAudio);
  callbackRef.current = onConfigureNativeAudio;

  useEffect(() => {
    const wrapped = (
      state: AudioEngineConfigurationState
    ): AppleAudioConfiguration => {
      const cb = callbackRef.current;
      const trackState = engineStateToTrackState(state);
      return cb
        ? cb(trackState, state.preferSpeakerOutput)
        : getDefaultAppleAudioConfigurationForMode(
            trackState,
            state.preferSpeakerOutput
          );
    };

    return setupIOSAudioManagement(preferSpeakerOutput, wrapped);
  }, [preferSpeakerOutput]);
}

/**
 * @deprecated Use the default behavior of `setupIOSAudioManagement` instead.
 *
 * Kept in sync with `getDefaultAppleAudioConfigurationForAudioState` in
 * `./AudioManager.ts`. If you change the defaults in one place, update the
 * other so the legacy path and the new path produce the same configuration.
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
