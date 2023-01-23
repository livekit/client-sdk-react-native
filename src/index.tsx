import { registerGlobals as webrtcRegisterGlobals } from 'react-native-webrtc';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import AudioSession from './audio/AudioSession';
import AndroidTimer from "react-native-background-timer-android";
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
    // @ts-ignore
    LKTimers.setTimeout = AndroidTimer.setTimeout
    // @ts-ignore
    LKTimers.clearTimeout = AndroidTimer.clearTimeout
    // @ts-ignore
    LKTimers.setInterval = AndroidTimer.setInterval
    // @ts-ignore
    LKTimers.clearInterval = AndroidTimer.clearInterval
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
