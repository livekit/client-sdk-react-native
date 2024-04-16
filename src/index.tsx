import { registerGlobals as webrtcRegisterGlobals } from '@livekit/react-native-webrtc';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import 'fastestsmallesttextencoderdecoder';
import AudioSession, {
  AndroidAudioTypePresets,
  AndroidAudioTypeOptions,
  AppleAudioCategory,
  AppleAudioCategoryOption,
  AppleAudioConfiguration,
  AppleAudioMode,
  AudioTrackState,
  getDefaultAppleAudioConfigurationForMode,
} from './audio/AudioSession';
import type { AudioConfiguration } from './audio/AudioSession';
import { PixelRatio, Platform } from 'react-native';
import type { LiveKitReactNativeInfo } from 'livekit-client';
import type { LogLevel, SetLogLevelOptions } from './logger';

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
  shimAsyncIterator();
  shimIterator();
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

function shimAsyncIterator() {
  var shim = require('well-known-symbols/Symbol.asyncIterator/shim');
  shim();
}

function shimIterator() {
  var shim = require('well-known-symbols/Symbol.iterator/shim');
  shim();
}
export * from './hooks';
export * from './components/LiveKitRoom';
export * from './components/VideoTrack';
export * from './components/VideoView'; // deprecated
export * from './useParticipant'; // deprecated
export * from './useRoom'; // deprecated
export * from './logger';
export * from './audio/AudioManager';

export {
  AudioSession,
  AudioConfiguration,
  AndroidAudioTypeOptions,
  AndroidAudioTypePresets,
  AppleAudioCategory,
  AppleAudioCategoryOption,
  AppleAudioConfiguration,
  AppleAudioMode,
  AudioTrackState,
  getDefaultAppleAudioConfigurationForMode,
  LogLevel,
  SetLogLevelOptions,
};
