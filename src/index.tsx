import 'well-known-symbols/Symbol.asyncIterator/auto';
import 'well-known-symbols/Symbol.iterator/auto';
import './polyfills/MediaRecorderShim';
import { registerGlobals as webrtcRegisterGlobals } from '@livekit/react-native-webrtc';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import './polyfills/EncoderDecoderTogether.min.js';
import AudioSession, {
  AndroidAudioTypePresets,
  type AndroidAudioTypeOptions,
  type AppleAudioCategory,
  type AppleAudioCategoryOption,
  type AppleAudioConfiguration,
  type AppleAudioMode,
  type AudioTrackState,
  getDefaultAppleAudioConfigurationForMode,
} from './audio/AudioSession';
import type { AudioConfiguration } from './audio/AudioSession';
import { PixelRatio, Platform } from 'react-native';
import { type LiveKitReactNativeInfo } from 'livekit-client';
import type { LogLevel, SetLogLevelOptions } from './logger';
import RNE2EEManager from './e2ee/RNE2EEManager';
import RNKeyProvider, { type RNKeyProviderOptions } from './e2ee/RNKeyProvider';
import { setupNativeEvents } from './events/EventEmitter';
import { ReadableStream, WritableStream } from 'web-streams-polyfill';

export interface RegisterGlobalsOptions {
  /**
   * Automatically configure audio session before accessing microphone.
   * When enabled, sets the iOS audio category to 'playAndRecord' before getUserMedia.
   * Has no effect on non-iOS platforms.
   *
   * @default true
   */
  autoConfigureAudioSession?: boolean;
}

/**
 * Registers the required globals needed for LiveKit to work.
 *
 * Must be called before using LiveKit.
 *
 * @param options Optional configuration for global registration
 */
export function registerGlobals(options?: RegisterGlobalsOptions) {
  const opts = {
    autoConfigureAudioSession: true,
    ...options,
  };

  webrtcRegisterGlobals();
  if (opts.autoConfigureAudioSession) {
    iosCategoryEnforce();
  }
  livekitRegisterGlobals();
  setupURLPolyfill();
  fixWebrtcAdapter();
  shimPromiseAllSettled();
  shimArrayAt();
  shimCryptoUuid();
  shimWebstreams();
  setupNativeEvents();
}

/**
 * Enforces changing to playAndRecord category prior to obtaining microphone.
 */
function iosCategoryEnforce() {
  if (Platform.OS === 'ios') {
    // @ts-ignore
    let getUserMediaFunc = global.navigator.mediaDevices.getUserMedia;
    // @ts-ignore
    global.navigator.mediaDevices.getUserMedia = async (constraints: any) => {
      if (constraints.audio) {
        await AudioSession.setAppleAudioConfiguration({
          audioCategory: 'playAndRecord',
        });
      }

      return await getUserMediaFunc(constraints);
    };
  }
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

function shimCryptoUuid() {
  let crypto = global.crypto;
  if (typeof global.crypto?.randomUUID !== 'function') {
    let createRandomUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
          /* eslint-disable no-bitwise */
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      ) as `${string}-${string}-${string}-${string}-${string}`;
    };

    if (!crypto) {
      crypto = {} as typeof global.crypto;
      global.crypto = crypto;
    }
    crypto.randomUUID = createRandomUUID;
  }
}

function shimWebstreams() {
  // @ts-expect-error: global.WritableStream isn't typed here.
  if (typeof global.WritableStream === 'undefined') {
    // @ts-expect-error
    global.WritableStream = WritableStream;
  }

  // @ts-expect-error: global.ReadableStream isn't typed here.
  if (typeof global.ReadableStream === 'undefined') {
    // @ts-expect-error
    global.ReadableStream = ReadableStream;
  }
}

export * from './hooks';
export * from './components/BarVisualizer';
export * from './components/LiveKitRoom';
export * from './components/VideoTrack';
export * from './components/VideoView'; // deprecated
export * from './useParticipant'; // deprecated
export * from './useRoom'; // deprecated
export * from './logger';
export * from './audio/AudioManager';

export {
  AudioSession,
  RNE2EEManager,
  RNKeyProvider,
  AndroidAudioTypePresets,
  getDefaultAppleAudioConfigurationForMode,
};
export type {
  AudioConfiguration,
  AndroidAudioTypeOptions,
  AppleAudioCategory,
  AppleAudioCategoryOption,
  AppleAudioConfiguration,
  AppleAudioMode,
  AudioTrackState,
  LogLevel,
  SetLogLevelOptions,
  RNKeyProviderOptions,
};
