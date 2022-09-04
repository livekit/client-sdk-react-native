import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'livekit-react-native' doesn't seem to be linked. Make sure: \n\n` +
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

export default class AudioSession {
  static startAudioSession = async () => {
    await LivekitReactNative.startAudioSession();
  };

  static stopAudioSession = async () => {
    await LivekitReactNative.stopAudioSession();
  };

  /**
   * Gets the available audio outputs for use with {@link setAudioOutputs}.
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
