import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RoomEvent, type Participant, type Room } from 'livekit-client';
import { useRoom, type RoomOptions } from '../useRoom';

// useRoom calls the real React hooks, which only work inside a component
// render. Mock them so the hook can be invoked directly: useEffect records its
// callback and deps, and the driver below replays React's Object.is dependency
// comparison to decide when the effect re-runs and its cleanup fires.
const mockEffectCalls: { fn: () => unknown; deps?: unknown[] }[] = [];
const mockRefCells: { current: unknown }[] = [];
let mockRefCursor = 0;

jest.mock('react', () => {
  const actual = jest.requireActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => [initial, jest.fn()],
    useRef: (initial: unknown) => {
      const cell = mockRefCells[mockRefCursor] ?? { current: initial };
      mockRefCells[mockRefCursor++] = cell;
      return cell;
    },
    useEffect: (fn: () => unknown, deps?: unknown[]) => {
      mockEffectCalls.push({ fn, deps });
    },
  };
});

let mountedDeps: unknown[] | undefined;
let mountedCleanup: (() => void) | undefined;

const renderUseRoom = (room: Room, options?: RoomOptions) => {
  mockEffectCalls.length = 0;
  mockRefCursor = 0;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- the hooks are mocked; the hook is called directly so the test controls each render.
  useRoom(room, options);
  for (const call of mockEffectCalls) {
    const prevDeps = mountedDeps;
    const depsChanged =
      prevDeps === undefined ||
      call.deps === undefined ||
      call.deps.length !== prevDeps.length ||
      call.deps.some((dep, i) => !Object.is(dep, prevDeps[i]));
    if (depsChanged) {
      mountedCleanup?.();
      const cleanup = call.fn();
      mountedCleanup =
        typeof cleanup === 'function' ? (cleanup as () => void) : undefined;
    }
    mountedDeps = call.deps;
  }
};

const unmount = () => {
  mountedCleanup?.();
};

const fakeRoom = () => {
  const room = {
    remoteParticipants: new Map<string, Participant>(),
    localParticipant: {} as Participant,
    disconnect: jest.fn(),
    once: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };
  room.on.mockReturnValue(room);
  room.off.mockReturnValue(room);
  return room;
};

beforeEach(() => {
  mountedDeps = undefined;
  mountedCleanup = undefined;
  mockEffectCalls.length = 0;
  mockRefCells.length = 0;
  mockRefCursor = 0;
});

describe('useRoom', () => {
  it('does not disconnect the room when re-rendered with a new inline sortParticipants', () => {
    const room = fakeRoom();
    renderUseRoom(room as unknown as Room, {
      sortParticipants: () => {},
    });
    renderUseRoom(room as unknown as Room, {
      sortParticipants: () => {},
    });
    renderUseRoom(room as unknown as Room, {
      sortParticipants: () => {},
    });

    expect(room.on).toHaveBeenCalled();
    expect(room.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects the room when the component unmounts', () => {
    const room = fakeRoom();
    renderUseRoom(room as unknown as Room);
    unmount();

    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });

  it('uses the latest sortParticipants after a re-render', () => {
    const room = fakeRoom();
    const first = jest.fn((_participants: Participant[]) => {});
    const second = jest.fn((_participants: Participant[]) => {});
    renderUseRoom(room as unknown as Room, { sortParticipants: first });
    renderUseRoom(room as unknown as Room, { sortParticipants: second });

    // The initial effect run already invoked `first`; reset the spies so only
    // the call below is counted.
    first.mockClear();
    second.mockClear();

    const onParticipantsChanged = room.on.mock.calls.find(
      ([event]) => event === RoomEvent.Reconnected
    )?.[1] as () => void;
    onParticipantsChanged();

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
