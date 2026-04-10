import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../LKNativeModule', () => ({
  __esModule: true,
  default: {
    configureAudio: jest.fn(),
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
});
