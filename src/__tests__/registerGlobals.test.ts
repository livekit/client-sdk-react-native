import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { RTCPeerConnection } from '@livekit/react-native-webrtc';
import { NativeModules } from 'react-native';
import { registerGlobals } from '../index';

type Configuration = ConstructorParameters<typeof RTCPeerConnection>[0];

jest.mock('react-native-url-polyfill', () => ({ setupURLPolyfill: jest.fn() }));

jest.mock('../LKNativeModule', () => ({
  __esModule: true,
  default: { addListener: jest.fn(), removeListeners: jest.fn() },
}));

jest.mock('@livekit/react-native-webrtc', () => {
  const { NativeModules: nativeModules } =
    jest.requireActual<typeof import('react-native')>('react-native');

  nativeModules.WebRTCModule = {
    peerConnectionInit: jest.fn(() => true),
    peerConnectionSetConfiguration: jest.fn(),
    peerConnectionClose: jest.fn(),
    audioDeviceModuleSetEngineCreatedActive: jest.fn(),
    audioDeviceModuleSetWillEnableEngineActive: jest.fn(),
    audioDeviceModuleSetWillStartEngineActive: jest.fn(),
    audioDeviceModuleSetDidStopEngineActive: jest.fn(),
    audioDeviceModuleSetDidDisableEngineActive: jest.fn(),
    audioDeviceModuleSetWillReleaseEngineActive: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  return jest.requireActual('@livekit/react-native-webrtc');
});

const webRTCModule = NativeModules.WebRTCModule as {
  peerConnectionInit: jest.Mock<
    (configuration: Configuration, id: number) => boolean
  >;
  peerConnectionSetConfiguration: jest.Mock<
    (configuration: Configuration, id: number) => void
  >;
};
let PeerConnection: typeof RTCPeerConnection;

beforeAll(() => {
  registerGlobals({ autoConfigureAudioSession: false });
  PeerConnection = (
    globalThis as unknown as { RTCPeerConnection: typeof RTCPeerConnection }
  ).RTCPeerConnection;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerGlobals SCTP SNAP shim', () => {
  it.each([
    [undefined, true],
    [{ enableSctpSnap: true }, true],
    [{ enableSctpSnap: false }, false],
  ])(
    'preserves the initial option from %j during ICE updates',
    (configuration, expected) => {
      const pc = new PeerConnection(configuration);

      try {
        expect(
          webRTCModule.peerConnectionInit.mock.calls[0]?.[0]?.enableSctpSnap
        ).toBe(expected);

        for (const url of [
          'stun:first.example.org',
          'stun:second.example.org',
        ]) {
          const update = Object.freeze({ iceServers: [{ urls: url }] });
          pc.setConfiguration(update);

          const nativeConfiguration =
            webRTCModule.peerConnectionSetConfiguration.mock.calls.at(-1)?.[0];
          expect(nativeConfiguration?.iceServers).toEqual(update.iceServers);
          // Native RTCConfiguration defaults an omitted option to false.
          expect(nativeConfiguration?.enableSctpSnap ?? false).toBe(expected);
        }
      } finally {
        pc.close();
      }
    }
  );

  it.each([
    [true, false],
    [false, true],
  ])(
    'forwards an explicit change from %s to %s for native validation',
    (initial, updated) => {
      const pc = new PeerConnection({ enableSctpSnap: initial });

      try {
        pc.setConfiguration({ enableSctpSnap: updated });
        expect(
          webRTCModule.peerConnectionSetConfiguration.mock.calls[0]?.[0]
            ?.enableSctpSnap
        ).toBe(updated);
      } finally {
        pc.close();
      }
    }
  );

  it('retains independent values for separate connections', () => {
    const enabled = new PeerConnection();
    const disabled = new PeerConnection({ enableSctpSnap: false });

    try {
      enabled.setConfiguration({ iceServers: [] });
      disabled.setConfiguration({ iceServers: [] });

      const [enabledCall, disabledCall] =
        webRTCModule.peerConnectionSetConfiguration.mock.calls;
      expect(enabledCall?.[0]?.enableSctpSnap ?? false).toBe(true);
      expect(disabledCall?.[0]?.enableSctpSnap ?? false).toBe(false);
      expect(enabledCall?.[1]).not.toBe(disabledCall?.[1]);
    } finally {
      enabled.close();
      disabled.close();
    }
  });
});
