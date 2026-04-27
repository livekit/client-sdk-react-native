import { Platform } from 'react-native';
import AudioSession, { type AppleAudioConfiguration } from './AudioSession';
import { log } from '../logger';
import { audioDeviceModuleEvents } from '@livekit/react-native-webrtc';

export type AudioEngineConfigurationState = {
  isPlayoutEnabled: boolean;
  isRecordingEnabled: boolean;
  preferSpeakerOutput: boolean;
};

const kAudioEngineErrorFailedToConfigureAudioSession = -4100;
let activeAudioManagementSetup: object | undefined;

/**
 * @inline
 */
type CleanupFn = () => void;

/**
 * Sets up automatic iOS audio session management based on audio engine state.
 *
 * Call this once at app startup (e.g. in index.js). `registerGlobals()`
 * invokes it for you by default unless `autoConfigureAudioSession: false`
 * is passed.
 *
 * @param preferSpeakerOutput - Whether to prefer speaker output. Defaults to true.
 * @param onConfigureNativeAudio - Optional custom callback for determining audio configuration.
 * @returns A cleanup function that removes the event handlers.
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

  const setupToken = {};
  activeAudioManagementSetup = setupToken;
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

  return () => {
    if (activeAudioManagementSetup !== setupToken) {
      return;
    }
    activeAudioManagementSetup = undefined;
    audioDeviceModuleEvents.setWillEnableEngineHandler(null);
    audioDeviceModuleEvents.setDidDisableEngineHandler(null);
  };
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
