import { registerGlobals as webrtcRegisterGlobals } from 'react-native-webrtc';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import AudioSession from './audio/AudioSession';
import AndroidTimer from 'react-native-background-timer-android';
import type { AudioConfiguration } from './audio/AudioSession';
import { Platform } from 'react-native';
import { CriticalTimers as LKTimers } from 'livekit-client';

/**
 * Registers the required globals needed for LiveKit to work.
 *
 * Must be called before using LiveKit.
 */
export function registerGlobals() {
  webrtcRegisterGlobals();
  setupURLPolyfill();
  fixWebrtcAdapter();
  shimPromiseAllSettled();
  fixBackgroundAndroid();
}

function fixBackgroundAndroid() {
  if (Platform.OS === 'android') {
    LKTimers.setTimeout = (...args: Parameters<typeof setTimeout>) => AndroidTimer.setTimeout(...args);
    LKTimers.setInterval = (...args: Parameters<typeof setInterval>) => AndroidTimer.setInterval(...args);
    LKTimers.clearTimeout = (...args: Parameters<typeof clearTimeout>) => AndroidTimer.clearTimeout(...args);
    LKTimers.clearInterval = (...args: Parameters<typeof clearInterval>) => AndroidTimer.clearInterval(...args);
  }
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

export * from './components/VideoView';
export * from './useParticipant';
export * from './useRoom';
export { AudioSession, AudioConfiguration };
