import type { Participant, Room } from 'livekit-client';
import { act, create } from 'react-test-renderer';

import { useRoom } from '../useRoom';

function fakeRoom() {
  const room: any = {
    remoteParticipants: new Map(),
    localParticipant: {},
    disconnect: jest.fn(),
    once: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };
  room.on.mockReturnValue(room);
  room.off.mockReturnValue(room);
  return room as Room & { disconnect: jest.Mock };
}

describe('useRoom', () => {
  it('does not disconnect the room when it re-renders with a new sortParticipants', () => {
    const room = fakeRoom();
    let renders = 0;
    const Probe = () => {
      // Without this guard, the unfixed hook re-renders forever.
      if (++renders > 20) {
        throw new Error('useRoom re-rendered in a loop');
      }
      // An inline function has a new identity on every render.
      useRoom(room, { sortParticipants: (_: Participant[]) => {} });
      return null;
    };

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Probe />);
    });
    act(() => {
      renderer.update(<Probe />);
    });
    act(() => {
      renderer.update(<Probe />);
    });

    expect(room.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects the room when the component unmounts', () => {
    const room = fakeRoom();
    const Probe = () => {
      useRoom(room);
      return null;
    };

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Probe />);
    });
    act(() => {
      renderer.unmount();
    });

    expect(room.disconnect).toHaveBeenCalledTimes(1);
  });

  it('uses the latest sortParticipants after a re-render', () => {
    const room = fakeRoom();
    const first = jest.fn();
    const second = jest.fn();
    const Probe = ({ sort }: { sort: (p: Participant[]) => void }) => {
      useRoom(room, { sortParticipants: sort });
      return null;
    };

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Probe sort={first} />);
    });
    act(() => {
      renderer.update(<Probe sort={second} />);
    });

    const onParticipantsChanged = (room.on as jest.Mock).mock.calls.find(
      ([event]) => event === 'reconnected'
    )![1];
    act(() => {
      onParticipantsChanged();
    });

    expect(second).toHaveBeenCalled();
  });
});
