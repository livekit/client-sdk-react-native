import {
  AudioTrack,
  connect,
  ConnectOptions,
  LocalParticipant,
  Participant,
  RemoteTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import { useCallback, useState } from "react";

export interface RoomState {
  connect: (
    url: string,
    token: string,
    options?: ConnectOptions
  ) => Promise<Room | undefined>;
  isConnecting: boolean;
  room?: Room;
  /* all participants in the room, including the local participant. */
  participants: Participant[];
  /* all subscribed audio tracks in the room, not including local participant. */
  audioTracks: AudioTrack[];
  error?: Error;
}

export interface RoomOptions {
  sortParticipants?: (participants: Participant[]) => void;
}

export function useRoom(options?: RoomOptions): RoomState {
  const [room, setRoom] = useState<Room>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);

  const sortFunc = options?.sortParticipants ?? sortParticipants;

  const connectFn = useCallback(
    async (url: string, token: string, options?: ConnectOptions) => {
      setIsConnecting(true);
      try {
        const newRoom = await connect(url, token, options);
        setRoom(newRoom);
        const onParticipantsChanged = () => {
          const remotes = Array.from(newRoom.participants.values());
          const participants: Participant[] = [newRoom.localParticipant];
          participants.push(...remotes);
          sortFunc(participants, newRoom.localParticipant);
          setParticipants(participants);
        };
        const onSubscribedTrackChanged = (track?: RemoteTrack) => {
          // ordering may have changed, re-sort
          onParticipantsChanged();
          if (track && track.kind !== Track.Kind.Audio) {
            return;
          }
          const tracks: AudioTrack[] = [];
          newRoom.participants.forEach((p) => {
            p.audioTracks.forEach((pub) => {
              if (pub.audioTrack) {
                tracks.push(pub.audioTrack);
              }
            });
          });
          setAudioTracks(tracks);
        };

        newRoom.once(RoomEvent.Disconnected, () => {
          setTimeout(() => setRoom(undefined));

          newRoom
            .off(RoomEvent.ParticipantConnected, onParticipantsChanged)
            .off(RoomEvent.ParticipantDisconnected, onParticipantsChanged)
            .off(RoomEvent.ActiveSpeakersChanged, onParticipantsChanged)
            .off(RoomEvent.TrackSubscribed, onSubscribedTrackChanged)
            .off(RoomEvent.TrackUnsubscribed, onSubscribedTrackChanged)
            .off(RoomEvent.LocalTrackPublished, onParticipantsChanged)
            .off(RoomEvent.LocalTrackUnpublished, onParticipantsChanged)
            .off(RoomEvent.AudioPlaybackStatusChanged, onParticipantsChanged);
        });
        newRoom
          .on(RoomEvent.ParticipantConnected, onParticipantsChanged)
          .on(RoomEvent.ParticipantDisconnected, onParticipantsChanged)
          .on(RoomEvent.ActiveSpeakersChanged, onParticipantsChanged)
          .on(RoomEvent.TrackSubscribed, onSubscribedTrackChanged)
          .on(RoomEvent.TrackUnsubscribed, onSubscribedTrackChanged)
          .on(RoomEvent.LocalTrackPublished, onParticipantsChanged)
          .on(RoomEvent.LocalTrackUnpublished, onParticipantsChanged)
          // trigger a state change by re-sorting participants
          .on(RoomEvent.AudioPlaybackStatusChanged, onParticipantsChanged);

        setIsConnecting(false);
        onSubscribedTrackChanged();

        return newRoom;
      } catch (error) {
        setIsConnecting(false);
        if (error instanceof Error) {
          setError(error);
        } else {
          setError(new Error("an error has occured"));
        }

        return undefined;
      }
    },
    []
  );

  return {
    connect: connectFn,
    isConnecting,
    room,
    error,
    participants,
    audioTracks,
  };
}

/**
 * Default sort for participants, it'll order participants by:
 * 1. dominant speaker (speaker with the loudest audio level)
 * 2. local participant
 * 3. other speakers that are recently active
 * 4. participants with video on
 * 5. by joinedAt
 */
export function sortParticipants(
  participants: Participant[],
  localParticipant?: LocalParticipant
) {
  participants.sort((a, b) => {
    // loudest speaker first
    if (a.isSpeaking && b.isSpeaking) {
      return b.audioLevel - a.audioLevel;
    }

    // speaker goes first
    if (a.isSpeaking !== b.isSpeaking) {
      if (a.isSpeaking) {
        return -1;
      } else {
        return 1;
      }
    }

    // last active speaker first
    if (a.lastSpokeAt !== b.lastSpokeAt) {
      const aLast = a.lastSpokeAt?.getTime() ?? 0;
      const bLast = b.lastSpokeAt?.getTime() ?? 0;
      return bLast - aLast;
    }

    // video on
    const aVideo = a.videoTracks.size > 0;
    const bVideo = b.videoTracks.size > 0;
    if (aVideo !== bVideo) {
      if (aVideo) {
        return -1;
      } else {
        return 1;
      }
    }

    // joinedAt
    return (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0);
  });

  if (localParticipant) {
    const localIdx = participants.indexOf(localParticipant);
    if (localIdx >= 0) {
      participants.splice(localIdx, 1);
      if (participants.length > 0) {
        participants.splice(1, 0, localParticipant);
      } else {
        participants.push(localParticipant);
      }
    }
  }
}
