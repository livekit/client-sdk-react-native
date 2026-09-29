import { act, create } from 'react-test-renderer';

type Handler = (event: unknown) => void;
const handlers: Record<string, Handler> = {};

jest.mock('../../events/EventEmitter', () => ({
  addListener: (_listener: unknown, name: string, handler: Handler) => {
    handlers[name] = handler;
  },
  removeListener: jest.fn(),
}));

jest.mock('../../LKNativeModule', () => ({
  __esModule: true,
  default: {
    createVolumeProcessor: jest.fn(() => 'tag-1'),
    deleteVolumeProcessor: jest.fn(),
  },
}));

import { useTrackVolume } from '../useTrackVolume';

const fakeTrack = () =>
  ({
    mediaStreamTrack: { id: 'mst-1', _peerConnectionId: 1 },
  }) as any;

// `Track` is checked with instanceof, so pass a track reference instead.
const fakeRef = () => ({ publication: { track: fakeTrack() } }) as any;

function renderHook<T>(useHook: () => T) {
  const result: { current: T } = { current: undefined as unknown as T };
  const Probe = () => {
    result.current = useHook();
    return null;
  };
  act(() => {
    create(<Probe />);
  });
  return result;
}

describe('useTrackVolume', () => {
  it('drops back to 0 when the native processor reports silence', () => {
    const ref = fakeRef();
    const result = renderHook(() => useTrackVolume(ref));

    act(() => {
      handlers.LK_VOLUME_PROCESSED!({ id: 'tag-1', volume: 0.4 });
    });
    expect(result.current).toBe(0.4);

    act(() => {
      handlers.LK_VOLUME_PROCESSED!({ id: 'tag-1', volume: 0 });
    });
    expect(result.current).toBe(0);
  });
});
