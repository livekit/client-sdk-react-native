import { registerGlobals as webrtcRegisterGlobals } from 'react-native-webrtc';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import AudioSession from './audio/AudioSession';
import type { AudioConfiguration } from './audio/AudioSession';
import { PixelRatio, Platform } from 'react-native';
import type { LiveKitReactNativeInfo } from 'livekit-client';

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
  shimArrayAt();
}
function livekitRegisterGlobals() {
  let lkGlobal: LiveKitReactNativeInfo = {
    platform: Platform.OS,
    devicePixelRatio: PixelRatio.get(),
  };

  // @ts-ignore
  global.LiveKitReactNativeGlobal = lkGlobal;
}

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

function shimArrayAt() {
  // Some versions of RN don't have Array.prototype.at, which is used by sdp-transform
  if (!Array.prototype.at) {
    var at = require('array.prototype.at');
    at.shim();
  }
}

export * from './components/VideoView';
export * from './useParticipant';
export * from './useRoom';
export { AudioSession, AudioConfiguration };
