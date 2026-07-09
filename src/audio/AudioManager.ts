import { Platform } from 'react-native';
import AudioSession, { type AppleAudioConfiguration } from './AudioSession';
import { log } from '../logger';
import {
  audioDeviceModuleEvents,
  AudioDeviceModule,
} from '@livekit/react-native-webrtc';

export type AudioEngineConfigurationState = {
  isPlayoutEnabled: boolean;
  isRecordingEnabled: boolean;
  preferSpeakerOutput: boolean;
};

const kAudioEngineErrorFailedToConfigureAudioSession = -4100;
let activeSetupToken: object | undefined;

/**
 * @inline
 */
type CleanupFn = () => void;

// Wraps a path-specific teardown so each setup supersedes the previous one
// cleanly: the returned cleanup tears down only while its setup is still the
// active one, so it runs at most once and a stale cleanup from a superseded
// setup is a no-op. A new setup defuses the previous cleanup by replacing the
// token rather than by running its teardown, because each path's body already
// replaces the other path's mechanism in an order that never leaves the hooks
// unowned - running the old teardown first would reopen exactly that window.
function finalizeAudioManagement(
  token: object,
  teardown: CleanupFn
): CleanupFn {
  return () => {
    if (activeSetupToken !== token) {
      return;
    }
    activeSetupToken = undefined;
    teardown();
  };
}

/**
 * Sets up automatic iOS audio session management based on audio engine state.
 *
 * Call this once at app startup (e.g. in index.js). `registerGlobals()`
 * invokes it for you by default unless `autoConfigureAudioSession: false`
 * is passed.
 *
 * By default the audio session is configured and activated natively as the
 * audio engine changes state, with no JavaScript involvement per transition.
 *
 * When `onConfigureNativeAudio` is provided, it runs inside the audio
 * engine's lifecycle callbacks while native code waits for the result, with
 * the wait bounded at a few seconds per callback. The callback must return
 * quickly and should only derive the configuration to apply. It must not
 * call APIs that enter the WebRTC engine or a peer connection (for example
 * `addTransceiver`, `getUserMedia`, or device enumeration): those can block
 * on the same engine operation the callback is holding up, and the operation
 * would stall until the native wait times out.
 *
 * Calling this again replaces the previous setup, including switching
 * between the default and custom paths. Prefer switching while disconnected.
 * A switch during an active call only takes full effect from the next audio
 * engine transition onward.
 *
 * @param preferSpeakerOutput - Whether to prefer speaker output. Defaults to true.
 * @param onConfigureNativeAudio - Optional custom callback for determining audio configuration.
 * @returns A cleanup function that removes the installed handlers or native
 *   configuration. A cleanup function from a superseded setup is a no-op.
 */
export function setupIOSAudioManagement(
  preferSpeakerOutput = true,
  onConfigureNativeAudio?: (
    configurationState: AudioEngineConfigurationState
  ) => AppleAudioConfiguration
): CleanupFn {
  if (Platform.OS !== 'ios') {
    return () => {};
  }

  // Supersede any previous setup (safe to call repeatedly, and to switch between
  // default and custom). Claiming the token defuses the previous cleanup without
  // running it. The path bodies below then replace the other path's mechanism in
  // an order that keeps the hooks owned throughout the switch.
  const setupToken = {};
  activeSetupToken = setupToken;

  // Default path: configure the AVAudioSession natively so the engine's
  // worker thread never round-trips to JS in willEnable/didDisable - that round
  // trip is what can deadlock. The native observer applies `recording` while
  // recording, `playout` while playout-only, and deactivates on full stop.
  if (!onConfigureNativeAudio) {
    AudioDeviceModule.setAutomaticAudioSessionConfiguration({
      recording: getDefaultAppleAudioConfigurationForAudioState({
        isPlayoutEnabled: true,
        isRecordingEnabled: true,
        preferSpeakerOutput,
      }),
      playout: getDefaultAppleAudioConfigurationForAudioState({
        isPlayoutEnabled: true,
        isRecordingEnabled: false,
        preferSpeakerOutput,
      }),
      deactivateOnStop: true,
    });

    // Set native config first, then clear any handlers a prior custom setup left
    // registered, so native (not a stale JS handler) owns the hooks. In the brief
    // overlap a still-registered handler wins, so a racing callback is never dropped.
    audioDeviceModuleEvents.setWillEnableEngineHandler(null);
    audioDeviceModuleEvents.setDidDisableEngineHandler(null);

    return finalizeAudioManagement(setupToken, () => {
      AudioDeviceModule.setAutomaticAudioSessionConfiguration(null);
    });
  }

  // Custom path: derive + apply the session config in JS via the engine handlers
  // (still bounded by the native 2s wait). The native default is cleared *after*
  // the handlers are registered (below) so the JS handler, which takes precedence,
  // owns the hooks throughout the switch.

  let audioEngineState: AudioEngineConfigurationState = {
    isPlayoutEnabled: false,
    isRecordingEnabled: false,
    preferSpeakerOutput,
  };

  const tryConfigure = async (
    newState: AudioEngineConfigurationState,
    oldState: AudioEngineConfigurationState
  ) => {
    if (
      !newState.isPlayoutEnabled &&
      !newState.isRecordingEnabled &&
      (oldState.isPlayoutEnabled || oldState.isRecordingEnabled)
    ) {
      log.info('AudioSession deactivating...');
      await AudioSession.stopAudioSession();
    } else if (newState.isRecordingEnabled || newState.isPlayoutEnabled) {
      const config = onConfigureNativeAudio
        ? onConfigureNativeAudio(newState)
        : getDefaultAppleAudioConfigurationForAudioState(newState);
      log.info('AudioSession configuring category:', config.audioCategory);
      await AudioSession.setAppleAudioConfiguration(config);
      if (!oldState.isPlayoutEnabled && !oldState.isRecordingEnabled) {
        log.info('AudioSession activating...');
        await AudioSession.startAudioSession();
      }
    }
  };

  const handleEngineStateUpdate = async ({
    isPlayoutEnabled,
    isRecordingEnabled,
  }: {
    isPlayoutEnabled: boolean;
    isRecordingEnabled: boolean;
  }) => {
    const oldState = audioEngineState;
    const newState: AudioEngineConfigurationState = {
      isPlayoutEnabled,
      isRecordingEnabled,
      preferSpeakerOutput: audioEngineState.preferSpeakerOutput,
    };

    // If tryConfigure throws, the error propagates to the native audio engine
    // observer which converts it to a non-zero error code, causing the engine
    // to stop/rollback (matching the Swift SDK's error propagation pattern).
    try {
      await tryConfigure(newState, oldState);
    } catch (error) {
      log.error(
        'AudioSession configuration failed, stopping audio engine:',
        error
      );
      // Throw the error code so the native AudioDeviceModuleObserver returns it
      // to the WebRTC engine, which will stop/rollback the operation.

      throw kAudioEngineErrorFailedToConfigureAudioSession;
    }
    // Update the audio state only if configure succeeds
    audioEngineState = newState;
  };

  audioDeviceModuleEvents.setWillEnableEngineHandler(handleEngineStateUpdate);
  audioDeviceModuleEvents.setDidDisableEngineHandler(handleEngineStateUpdate);

  // Handlers are live now, so clear the native default - the JS handler takes
  // precedence, so there is never a window where neither path is active.
  AudioDeviceModule.setAutomaticAudioSessionConfiguration(null);

  return finalizeAudioManagement(setupToken, () => {
    audioDeviceModuleEvents.setWillEnableEngineHandler(null);
    audioDeviceModuleEvents.setDidDisableEngineHandler(null);
  });
}

// Kept in sync with `getDefaultAppleAudioConfigurationForMode` in
// `./AudioManagerLegacy.ts`. If you change the defaults in one place,
// update the other so the legacy path and the new path stay aligned.
function getDefaultAppleAudioConfigurationForAudioState(
  configurationState: AudioEngineConfigurationState
): AppleAudioConfiguration {
  if (configurationState.isRecordingEnabled) {
    return {
      audioCategory: 'playAndRecord',
      audioCategoryOptions: ['allowBluetooth', 'mixWithOthers'],
      audioMode: configurationState.preferSpeakerOutput
        ? 'videoChat'
        : 'voiceChat',
    };
  } else if (configurationState.isPlayoutEnabled) {
    return {
      audioCategory: 'playback',
      audioCategoryOptions: ['mixWithOthers'],
      audioMode: 'spokenAudio',
    };
  }

  return {
    audioCategory: 'soloAmbient',
    audioCategoryOptions: [],
    audioMode: 'default',
  };
}
