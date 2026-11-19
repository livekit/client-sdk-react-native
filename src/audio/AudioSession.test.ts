import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../LKNativeModule', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn(),
    configureAudio: jest.fn(),
    removeListeners: jest.fn(),
    startAudioSession: jest.fn(),
    stopAudioSession: jest.fn(),
    startLocalRecording: jest.fn(),
    stopLocalRecording: jest.fn(),
  },
}));

import LiveKitModule from '../LKNativeModule';
import AudioSession from './AudioSession';

describe('AudioSession local recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('delegates startLocalRecording to the native module', async () => {
    await AudioSession.startLocalRecording();

    expect(LiveKitModule.startLocalRecording).toHaveBeenCalledTimes(1);
  });

  test('delegates stopLocalRecording to the native module', async () => {
    await AudioSession.stopLocalRecording();

    expect(LiveKitModule.stopLocalRecording).toHaveBeenCalledTimes(1);
  });

  test('accepts audio recording state events from the native emitter registry', () => {
    const actualEventEmitterModule = jest.requireActual<
      typeof import('../events/EventEmitter')
    >('../events/EventEmitter');

    expect(() =>
      actualEventEmitterModule.addListener(
        {},
        'LK_AUDIO_RECORDING_STATE',
        jest.fn()
      )
    ).not.toThrow();
  });
});
