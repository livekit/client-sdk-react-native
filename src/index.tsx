//import { NativeModules, Platform } from 'react-native';
import { registerGlobals as webrtcRegisterGlobals } from 'react-native-webrtc'

// const LINKING_ERROR =
//   `The package 'livekit-react-native' doesn't seem to be linked. Make sure: \n\n` +
//   Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
//   '- You rebuilt the app after installing the package\n' +
//   '- You are not using Expo managed workflow\n';

// const LivekitReactNative = NativeModules.LivekitReactNative
//   ? NativeModules.LivekitReactNative
//   : new Proxy(
//       {},
//       {
//         get() {
//           throw new Error(LINKING_ERROR);
//         },
//       }
//     );

export function registerGlobals() {
  webrtcRegisterGlobals()
}

export * from './components/VideoView'