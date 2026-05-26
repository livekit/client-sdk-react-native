// Automatic polyfills, keep these at the top.
import 'well-known-symbols/Symbol.asyncIterator/auto';
import 'well-known-symbols/Symbol.iterator/auto';
import './polyfills/DOMException';
// Caution: This has a transitive import of livekit-client, keep last.
import './polyfills/MediaRecorderShim';

import {
  registerGlobals as webrtcRegisterGlobals,
  AudioDeviceModule,
  AudioEngineMuteMode,
  AudioEngineAvailability,
  audioDeviceModuleEvents,
} from '@livekit/react-native-webrtc';
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
} from './audio/AudioSession';
import type { AudioConfiguration } from './audio/AudioSession';
import { PixelRatio, Platform } from 'react-native';
import { setupIOSAudioManagement } from './audio/AudioManager';
import { type LiveKitReactNativeInfo } from 'livekit-client';
import type { LogLevel, SetLogLevelOptions } from './logger';
import RNE2EEManager from './e2ee/RNE2EEManager';
import RNKeyProvider, { type RNKeyProviderOptions } from './e2ee/RNKeyProvider';
import { setupNativeEvents } from './events/EventEmitter';
import {
  ReadableStream,
  WritableStream,
  CountQueuingStrategy,
  TransformStream,
} from 'web-streams-polyfill';

export interface RegisterGlobalsOptions {
  /**
   * Automatically configure and activate the iOS audio session
   * based on audio engine lifecycle events.
   * Has no effect on non-Apple platforms.
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
    setupIOSAudioManagement();
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
  // @ts-expect-error: global.CountQueuingStrategy isn't typed here.
  if (typeof global.CountQueuingStrategy === 'undefined') {
    // @ts-expect-error
    global.CountQueuingStrategy = CountQueuingStrategy;
  }
  // @ts-expect-error: global.TransformStream isn't typed here.
  if (typeof global.TransformStream === 'undefined') {
    // @ts-expect-error
    global.TransformStream = TransformStream;
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
export * from './audio/AudioManagerLegacy';
export * from './audio/MediaRecorder';

export {
  AudioSession,
  AudioDeviceModule,
  AudioEngineMuteMode,
  AudioEngineAvailability,
  audioDeviceModuleEvents,
  RNE2EEManager,
  RNKeyProvider,
  AndroidAudioTypePresets,
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
