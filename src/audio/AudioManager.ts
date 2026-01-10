import AudioSession, {
  type AppleAudioConfiguration,
} from './AudioSession';
import { log } from '..';
import { audioDeviceModuleEvents } from '@livekit/react-native-webrtc';

export type AudioEngineConfigurationState = {
  isPlayoutEnabled: boolean;
  isRecordingEnabled: boolean;
  preferSpeakerOutput: boolean;
};

/**
 * Handles setting the appropriate AVAudioSession options automatically
 * depending on the audio track states of the Room.
 *
 * @param preferSpeakerOutput
 * @param onConfigureNativeAudio A custom method for determining options used.
 */
export function useIOSAudioManagement(
  preferSpeakerOutput = true,
  onConfigureNativeAudio?: (configurationState: AudioEngineConfigurationState) => AppleAudioConfiguration
) {
  let audioEngineState: AudioEngineConfigurationState = {
    isPlayoutEnabled: false,
    isRecordingEnabled: false,
    preferSpeakerOutput: preferSpeakerOutput,
  };

  const tryConfigure = async (newState: AudioEngineConfigurationState, oldState: AudioEngineConfigurationState) => {
    if ((!newState.isPlayoutEnabled && !newState.isRecordingEnabled) && (oldState.isPlayoutEnabled || oldState.isRecordingEnabled)) {
      log.info("AudioSession deactivating...")
      await AudioSession.stopAudioSession()
    } else if (newState.isRecordingEnabled || newState.isPlayoutEnabled) {
      const config = onConfigureNativeAudio ? onConfigureNativeAudio(newState) : getDefaultAppleAudioConfigurationForAudioState(newState);
      log.info("AudioSession configuring category:", config.audioCategory)
      await AudioSession.setAppleAudioConfiguration(config)
      if (!oldState.isPlayoutEnabled && !oldState.isRecordingEnabled) {
        log.info("AudioSession activating...")
        await AudioSession.startAudioSession()
      }
    }
  };

  const handleEngineStateUpdate = async ({ isPlayoutEnabled, isRecordingEnabled }: { isPlayoutEnabled: boolean, isRecordingEnabled: boolean }) => {
    const oldState = audioEngineState;
    const newState = {
      isPlayoutEnabled,
      isRecordingEnabled,
      preferSpeakerOutput: audioEngineState.preferSpeakerOutput,
    };

    // If this throws, the audio engine will not continue it's operation
    await tryConfigure(newState, oldState);
    // Update the audio state only if configure succeeds
    audioEngineState = newState;
  };

  // Attach audio engine events
  audioDeviceModuleEvents.setWillEnableEngineHandler(handleEngineStateUpdate);
  audioDeviceModuleEvents.setDidDisableEngineHandler(handleEngineStateUpdate);
}

function getDefaultAppleAudioConfigurationForAudioState(
  configurationState: AudioEngineConfigurationState,
): AppleAudioConfiguration {
  if (configurationState.isRecordingEnabled) {
    return {
      audioCategory: 'playAndRecord',
      audioCategoryOptions: ['allowBluetooth', 'mixWithOthers'],
      audioMode: configurationState.preferSpeakerOutput ? 'videoChat' : 'voiceChat',
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
