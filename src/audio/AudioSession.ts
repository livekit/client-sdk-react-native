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
 *   1. `"speaker"`
 *   2. `"earpiece"`
 *   3. `"headset"`
 *   4. `"bluetooth"`
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
    audioMode?:
      | 'normal'
      | 'callScreening'
      | 'inCall'
      | 'inCommunication'
      | 'ringtone';
    audioFocusMode?:
      | 'gain'
      | 'gainTransient'
      | 'gainTransientExclusive'
      | 'gainTransientMayDuck';
  };
  ios?: {
    defaultOutput?: 'speaker' | 'earpiece';
  };
};

export default class AudioSession {
  /**
   * Applies the provided audio configuration to the underlying AudioSession.
   *
   * Must be called prior to connecting to a Room for the configuration to apply correctly.
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
   * Note: For applications targeting SDK versions over 30, the runtime BLUETOOTH_CONNECT
   * permission must be requested to send audio to bluetooth headsets.
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
}
