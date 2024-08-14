import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR =
  `The package '@livekit/react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const LivekitReactNative = NativeModules.LivekitReactNative
  ? NativeModules.LivekitReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

/**
 * Configuration for the underlying AudioSession.
 *
 * ----
 * Android specific options:
 *
 * * preferredOutputList - The preferred order in which to automatically select an audio output.
 *   This is ignored when an output is manually selected with {@link AudioSession.selectAudioOutput}.
 *
 *   By default, the order is set to:
 *   1. `"bluetooth"
 *   2. `"headset"``
 *   3. `"speaker"`
 *   4. `"earpiece"`
 *
 * * audioTypeOptions - An {@link AndroidAudioTypeOptions} object which provides the
 *   audio options to use on Android.
 *
 *   See {@link AndroidAudioTypePresets} for pre-configured values.
 *
 * ----
 * iOS
 *
 * * defaultOutput - The default preferred output to use when a wired headset or bluetooth output is unavailable.
 *
 *   By default, this is set to `"speaker"`
 */
export type AudioConfiguration = {
  android?: {
    preferredOutputList?: ('speaker' | 'earpiece' | 'headset' | 'bluetooth')[];
    audioTypeOptions: AndroidAudioTypeOptions;
  };
  ios?: {
    defaultOutput?: 'speaker' | 'earpiece';
  };
};

export type AndroidAudioTypeOptions = {
  /**
   * Whether LiveKit should handle managing the audio focus or not.
   *
   * Defaults to true.
   */
  manageAudioFocus?: boolean;

  /**
   * Corresponds to {@link https://developer.android.com/reference/android/media/AudioManager#setMode(int)}
   *
   * Defaults to 'inCommunication'.
   */
  audioMode?:
    | 'normal'
    | 'callScreening'
    | 'inCall'
    | 'inCommunication'
    | 'ringtone';

  /**
   * Corresponds to the duration hint when requesting audio focus.
   *
   * Defaults to 'gain'.
   *
   * See also {@link https://developer.android.com/reference/android/media/AudioManager#AUDIOFOCUS_GAIN}
   */
  audioFocusMode?:
    | 'gain'
    | 'gainTransient'
    | 'gainTransientExclusive'
    | 'gainTransientMayDuck';

  /**
   * Corresponds to Android's AudioAttributes usage type.
   *
   * Defaults to 'voiceCommunication'.
   *
   * See also {@link https://developer.android.com/reference/android/media/AudioAttributes}
   */
  audioAttributesUsageType?:
    | 'alarm'
    | 'assistanceAccessibility'
    | 'assistanceNavigationGuidance'
    | 'assistanceSonification'
    | 'assistant'
    | 'game'
    | 'media'
    | 'notification'
    | 'notificationEvent'
    | 'notificationRingtone'
    | 'unknown'
    | 'voiceCommunication'
    | 'voiceCommunicationSignalling';

  /**
   * Corresponds to Android's AndroidAttributes content type.
   *
   * Defaults to 'speech'.
   *
   * See also {@link https://developer.android.com/reference/android/media/AudioAttributes}
   */
  audioAttributesContentType?:
    | 'movie'
    | 'music'
    | 'sonification'
    | 'speech'
    | 'unknown';

  /**
   * Corresponds to the stream type when requesting audio focus. Used on pre-O devices.
   *
   * Defaults to 'voiceCall'
   *
   * See also {@link https://developer.android.com/reference/android/media/AudioManager#STREAM_VOICE_CALL}
   */
  audioStreamType?:
    | 'accessibility'
    | 'alarm'
    | 'dtmf'
    | 'music'
    | 'notification'
    | 'ring'
    | 'system'
    | 'voiceCall';

  /**
   * On certain Android devices, audio routing does not function properly and
   * bluetooth microphones will not work unless audio mode is set to
   * `inCommunication` or `inCall`. Audio routing is turned off those cases.
   *
   * If this set to true, will attempt to do audio routing regardless of audio mode.
   *
   * Defaults to false.
   */
  forceHandleAudioRouting?: boolean;
};

export const AndroidAudioTypePresets: {
  /**
   * A pre-configured AndroidAudioConfiguration for voice communication.
   */
  communication: AndroidAudioTypeOptions;
  /**
   * A pre-configured AndroidAudioConfiguration for media playback.
   */
  media: AndroidAudioTypeOptions;
} = {
  communication: {
    manageAudioFocus: true,
    audioMode: 'inCommunication',
    audioFocusMode: 'gain',
    audioStreamType: 'voiceCall',
    audioAttributesUsageType: 'voiceCommunication',
    audioAttributesContentType: 'speech',
  },
  media: {
    manageAudioFocus: true,
    audioMode: 'normal',
    audioFocusMode: 'gain',
    audioStreamType: 'music',
    audioAttributesUsageType: 'media',
    audioAttributesContentType: 'unknown',
  },
} as const;

export type AppleAudioMode =
  | 'default'
  | 'gameChat'
  | 'measurement'
  | 'moviePlayback'
  | 'spokenAudio'
  | 'videoChat'
  | 'videoRecording'
  | 'voiceChat'
  | 'voicePrompt';

export type AppleAudioCategory =
  | 'soloAmbient'
  | 'playback'
  | 'record'
  | 'playAndRecord'
  | 'multiRoute';

export type AppleAudioCategoryOption =
  | 'mixWithOthers'
  | 'duckOthers'
  | 'interruptSpokenAudioAndMixWithOthers'
  | 'allowBluetooth'
  | 'allowBluetoothA2DP'
  | 'allowAirPlay'
  | 'defaultToSpeaker';

export type AppleAudioConfiguration = {
  audioCategory?: AppleAudioCategory;
  audioCategoryOptions?: AppleAudioCategoryOption[];
  audioMode?: AppleAudioMode;
};

export type AudioTrackState =
  | 'none'
  | 'remoteOnly'
  | 'localOnly'
  | 'localAndRemote';

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

export default class AudioSession {
  /**
   * Applies the provided audio configuration to the underlying AudioSession.
   *
   * Must be called prior to connecting to a Room for the configuration to apply correctly.
   *
   * See also useIOSAudioManagement for automatic configuration of iOS audio options.
   */
  static configureAudio = async (config: AudioConfiguration) => {
    await LivekitReactNative.configureAudio(config);
  };

  /**
   * Starts an AudioSession.
   */
  static startAudioSession = async () => {
    await LivekitReactNative.startAudioSession();
  };

  /**
   * Stops the existing AudioSession.
   */
  static stopAudioSession = async () => {
    await LivekitReactNative.stopAudioSession();
  };

  /**
   * Gets the available audio outputs for use with {@link selectAudioOutput}.
   *
   * {@link startAudioSession} must be called prior to using this method.
   *
   * For Android, will return if available:
   * * "speaker"
   * * "earpiece"
   * * "headset"
   * * "bluetooth"
   *
   * ----
   *
   * For iOS, due to OS limitations, the only available types are:
   * * "default" - Use default iOS audio routing
   * * "force_speaker" - Force audio output through speaker
   *
   * See also {@link showAudioRoutePicker} to display a route picker that
   * can choose between other audio devices (i.e. headset/bluetooth/airplay),
   * or use a library like `react-native-avroutepicker` for a native platform
   * control.
   *
   * @returns the available audio output types
   */
  static getAudioOutputs = async (): Promise<string[]> => {
    if (Platform.OS === 'ios') {
      return ['default', 'force_speaker'];
    } else if (Platform.OS === 'android') {
      return (await LivekitReactNative.getAudioOutputs()) as string[];
    } else {
      return [];
    }
  };

  /**
   * Select the provided audio output if available.
   *
   * {@link startAudioSession} must be called prior to using this method.
   *
   * @param deviceId A deviceId retrieved from {@link getAudioOutputs}
   */
  static selectAudioOutput = async (deviceId: string) => {
    await LivekitReactNative.selectAudioOutput(deviceId);
  };

  /**
   * iOS only, requires iOS 11+.
   *
   * Displays an AVRoutePickerView for the user to choose their audio output.
   */
  static showAudioRoutePicker = async () => {
    if (Platform.OS === 'ios') {
      await LivekitReactNative.showAudioRoutePicker();
    }
  };

  /**
   * Directly change the AVAudioSession category/mode.
   *
   * @param config The configuration to use. Null values will be omitted and the
   * existing values will be unchanged.
   */
  static setAppleAudioConfiguration = async (
    config: AppleAudioConfiguration
  ) => {
    if (Platform.OS === 'ios') {
      await LivekitReactNative.setAppleAudioConfiguration(config);
    }
  };
}
