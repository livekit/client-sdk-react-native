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

/**
 * Static recording/playout policy for {@link setupIOSAudioManagement}.
 */
export type IOSAudioSessionPolicy = {
  recording: AppleAudioConfiguration;
  playout: AppleAudioConfiguration;
  /**
   * Whether to deactivate the audio session when both playout and recording
   * are disabled. Defaults to true.
   */
  deactivateOnStop?: boolean;
};

/**
 * @deprecated Unsafe. Prefer {@link IOSAudioSessionPolicy} or the default
 *   native path. See {@link setupIOSAudioManagement}.
 */
export type OnConfigureNativeAudio = (
  configurationState: AudioEngineConfigurationState
) => AppleAudioConfiguration;

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
 * For custom categories/modes, pass a static {@link IOSAudioSessionPolicy}.
 * That policy is pushed to native once and applied on the audio worker thread.
 *
 * Calling this again replaces the previous setup, including switching
 * between the default and custom paths. Switch while disconnected; a switch
 * during an active call is unsupported. In particular, switching away from a
 * custom callback setup mid-call abandons the audio session activation that
 * the custom handlers took, so the session may stay active after the call ends.
 *
 * @param preferSpeakerOutput - Whether to prefer speaker output. Defaults to true.
 * @returns A cleanup function that removes the installed handlers or native
 *   configuration. A cleanup function from a superseded setup is a no-op.
 */
export function setupIOSAudioManagement(
  preferSpeakerOutput?: boolean
): CleanupFn;
/**
 * Sets up automatic iOS audio session management with a static native policy.
 *
 * @param preferSpeakerOutput - Unused when a full policy is provided; kept for
 *   call-site consistency with the default overload.
 * @param policy - Static recording/playout configuration applied natively.
 * @see {@link setupIOSAudioManagement} for the default native path and usage notes.
 */
export function setupIOSAudioManagement(
  preferSpeakerOutput: boolean,
  policy: IOSAudioSessionPolicy
): CleanupFn;
/**
 * @deprecated The `onConfigureNativeAudio` callback is unsafe. It runs inside
 *   the audio engine's lifecycle callbacks while native code waits for the
 *   result (bounded at a few seconds). The callback must return quickly and
 *   must not call APIs that enter the WebRTC engine or a peer connection
 *   (for example `addTransceiver`, `getUserMedia`, or device enumeration):
 *   those can block on the same engine operation the callback is holding up.
 *   Prefer the default native path, or pass an {@link IOSAudioSessionPolicy}.
 */
export function setupIOSAudioManagement(
  preferSpeakerOutput: boolean,
  onConfigureNativeAudio: OnConfigureNativeAudio
): CleanupFn;
export function setupIOSAudioManagement(
  preferSpeakerOutput = true,
  policyOrCallback?: IOSAudioSessionPolicy | OnConfigureNativeAudio
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

  if (typeof policyOrCallback === 'function') {
    return setupCustomCallbackPath(
      setupToken,
      preferSpeakerOutput,
      policyOrCallback
    );
  }

  return setupNativePolicyPath(
    setupToken,
    preferSpeakerOutput,
    policyOrCallback
  );
}

function setupNativePolicyPath(
  setupToken: object,
  preferSpeakerOutput: boolean,
  policy?: IOSAudioSessionPolicy
): CleanupFn {
  // Configure the AVAudioSession natively so the engine's worker thread never
  // round-trips to JS in willEnable/didDisable - that round trip is what can
  // deadlock. The native observer applies `recording` while recording,
  // `playout` while playout-only, and deactivates on full stop when requested.
  AudioDeviceModule.setAutomaticAudioSessionConfiguration({
    recording:
      policy?.recording ??
      getDefaultAppleAudioConfigurationForAudioState({
        isPlayoutEnabled: true,
        isRecordingEnabled: true,
        preferSpeakerOutput,
      }),
    playout:
      policy?.playout ??
      getDefaultAppleAudioConfigurationForAudioState({
        isPlayoutEnabled: true,
        isRecordingEnabled: false,
        preferSpeakerOutput,
      }),
    deactivateOnStop: policy?.deactivateOnStop ?? true,
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

function setupCustomCallbackPath(
  setupToken: object,
  preferSpeakerOutput: boolean,
  onConfigureNativeAudio: OnConfigureNativeAudio
): CleanupFn {
  log.warn(
    'setupIOSAudioManagement(onConfigureNativeAudio) is deprecated and unsafe. ' +
      'Prefer the default native path, or pass an IOSAudioSessionPolicy object.'
  );

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
      const config = onConfigureNativeAudio(newState);
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
