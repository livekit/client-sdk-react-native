import { describe, expect, jest, test } from '@jest/globals';
import type { MediaStream } from '@livekit/react-native-webrtc';

jest.mock('../events/EventEmitter', () => ({
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

jest.mock('../LKNativeModule', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn(),
    createAudioSinkListener: jest.fn(() => 'react-tag-1'),
    deleteAudioSinkListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

import { MediaRecorder } from './MediaRecorder';
import * as eventEmitterModule from '../events/EventEmitter';

const createStream = () =>
  ({
    getAudioTracks: () => [
      {
        _peerConnectionId: 42,
        id: 'audio-track-1',
      },
    ],
  }) as unknown as MediaStream;

describe('MediaRecorder shim', () => {
  test('reports iOS-compatible preconnect mime support', () => {
    expect(MediaRecorder.isTypeSupported('video/mp4')).toBe(true);
    expect(MediaRecorder.isTypeSupported('audio/webm;codecs=opus')).toBe(false);
  });

  test('honors a supported requested mime type and defaults to audio/pcm', () => {
    const stream = {} as MediaStream;

    expect(new MediaRecorder(stream).mimeType).toBe('audio/pcm');
    expect(new MediaRecorder(stream, { mimeType: 'video/mp4' }).mimeType).toBe(
      'video/mp4'
    );
    expect(
      new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }).mimeType
    ).toBe('audio/pcm');
  });

  test('logs recorder timing around start, first chunk, and first dispatch', () => {
    const mockAddListener = jest.mocked(eventEmitterModule.addListener);
    const consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const recorder = new MediaRecorder(createStream(), {
      mimeType: 'video/mp4',
    });

    recorder.start();

    const audioDataHandler = mockAddListener.mock.calls.find(
      ([, eventName]) => eventName === 'LK_AUDIO_DATA'
    )?.[2] as ((event: { data: string; id: string }) => void) | undefined;

    expect(audioDataHandler).toBeDefined();

    audioDataHandler?.({
      data: 'AQID',
      id: 'react-tag-1',
    });

    recorder.requestData();

    const debugLogs = consoleLogSpy.mock.calls
      .filter(([tag]) => tag === 'lk-rn-media-recorder-debug')
      .map(([, payload]) => JSON.parse(String(payload)).stage);

    expect(debugLogs).toEqual([
      'start_entered',
      'create_audio_sink_listener_requested',
      'create_audio_sink_listener_completed',
      'start_completed',
      'first_audio_chunk_received',
      'first_data_dispatched',
    ]);

    consoleLogSpy.mockRestore();
  });

  test('mirrors native preconnect debug events to the JS console timeline', () => {
    const mockAddListener = jest.mocked(eventEmitterModule.addListener);
    const consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const recorder = new MediaRecorder(createStream(), {
      mimeType: 'video/mp4',
    });

    recorder.start();

    const nativeDebugHandler = mockAddListener.mock.calls.find(
      ([, eventName]) => eventName === 'LK_PRECONNECT_DEBUG'
    )?.[2] as
      | ((event: { id: string; stage: string; sampleRate: number }) => void)
      | undefined;

    expect(nativeDebugHandler).toBeDefined();

    nativeDebugHandler?.({
      id: 'react-tag-1',
      sampleRate: 48000,
      stage: 'first_native_pcm_chunk',
    });

    const nativeLogs = consoleLogSpy.mock.calls
      .filter(([tag]) => tag === 'lk-rn-native-preconnect-debug')
      .map(([, payload]) => JSON.parse(String(payload)));

    expect(nativeLogs).toContainEqual(
      expect.objectContaining({
        mimeType: 'video/mp4',
        reactTag: 'react-tag-1',
        sampleRate: 48000,
        stage: 'first_native_pcm_chunk',
      })
    );

    consoleLogSpy.mockRestore();
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
