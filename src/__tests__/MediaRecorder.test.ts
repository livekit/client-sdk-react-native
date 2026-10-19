import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DeviceEventEmitter } from 'react-native';
import type { MediaStream } from '@livekit/react-native-webrtc';
import { MediaRecorder } from '../audio/MediaRecorder';
import { setupNativeEvents } from '../events/EventEmitter';
import LiveKitModule from '../LKNativeModule';

jest.mock('../LKNativeModule', () => {
  let nextTag = 0;
  return {
    __esModule: true,
    default: {
      createAudioSinkListener: jest.fn(() => `sink-${nextTag++}`),
      deleteAudioSinkListener: jest.fn(),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
  };
});

// The real package loads native WebRTC modules; MediaRecorder only needs the
// event target helpers it re-exports.
jest.mock('@livekit/react-native-webrtc', () =>
  jest.requireActual(
    '@livekit/react-native-webrtc/lib/commonjs/vendor/event-target-shim'
  )
);

setupNativeEvents();

const fakeStream = {
  getAudioTracks: () => [{ id: 'track-1', _peerConnectionId: 1 }],
} as unknown as MediaStream;

// Native sink data arrives as base64 strings tagged with the sink id.
const emitAudioData = (id: string | undefined, bytes: number[]) => {
  DeviceEventEmitter.emit('LK_AUDIO_DATA', {
    id,
    data: Buffer.from(bytes).toString('base64'),
  });
};

const recordOnce = (recorder: MediaRecorder, bytes: number[]) => {
  const chunks: Uint8Array[] = [];
  const onData = (event: { data: { byteArray: Uint8Array } }) => {
    chunks.push(event.data.byteArray);
  };
  recorder.addEventListener('dataavailable', onData as never);
  recorder.start();
  emitAudioData(recorder._reactTag, bytes);
  recorder.stop();
  recorder.removeEventListener('dataavailable', onData as never);
  return chunks;
};

describe('MediaRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records each chunk once when started again after stop', () => {
    const recorder = new MediaRecorder(fakeStream);

    const first = recordOnce(recorder, [1, 2, 3]);
    const second = recordOnce(recorder, [4, 5, 6]);

    expect(first.map((c) => Array.from(c))).toEqual([[1, 2, 3]]);
    expect(second.map((c) => Array.from(c))).toEqual([[4, 5, 6]]);
  });

  it('deletes the native sink only once when stopped twice', () => {
    const recorder = new MediaRecorder(fakeStream);

    recorder.start();
    recorder.stop();
    recorder.stop();

    expect(LiveKitModule.deleteAudioSinkListener).toHaveBeenCalledTimes(1);
  });
});
