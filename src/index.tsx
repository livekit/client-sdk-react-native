import { registerGlobals as webrtcRegisterGlobals } from 'react-native-webrtc';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import AudioSession from './audio/AudioSession';
import type { AudioConfiguration } from './audio/AudioSession';
import { Platform } from 'react-native';
import type { PlatformOSType } from 'react-native';

/**
 * Registers the required globals needed for LiveKit to work.
 *
 * Must be called before using LiveKit.
 */
export function registerGlobals() {
  webrtcRegisterGlobals();
  livekitRegisterGlobals();
  setupURLPolyfill();
  fixWebrtcAdapter();
  shimPromiseAllSettled();
}
function livekitRegisterGlobals() {
  let lkGlobal: LiveKitReactNativeGlobal = {
    platform: Platform.OS,
  };

  // @ts-ignore
  global.LiveKitReactNativeGlobal = lkGlobal;
}

// Globals needed in the LiveKit JS client
type LiveKitReactNativeGlobal = {
  platform: PlatformOSType;
};

function fixWebrtcAdapter() {
  // @ts-ignore
  if (window?.navigator !== undefined) {
    // @ts-ignore
    const { navigator } = window;
    if (navigator.userAgent === undefined) {
      navigator.userAgent = navigator.product ?? 'Unknown';
    }
  }
}

function shimPromiseAllSettled() {
  var allSettled = require('promise.allsettled');
  allSettled.shim();
}

export * from './components/VideoView';
export * from './useParticipant';
export * from './useRoom';
export { AudioSession, AudioConfiguration };
