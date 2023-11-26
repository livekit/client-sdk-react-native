import { useState, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { RoomEvent, type Room } from 'livekit-client';
import AudioSession, {
  getDefaultAppleAudioConfigurationForMode,
  type AppleAudioConfiguration,
  type AudioTrackState,
} from './AudioSession';
import { log } from '..';

/**
 * Handles setting the appropriate AVAudioSession options automatically
 * depending on the audio track states of the Room.
 *
 * @param room
 * @param preferSpeakerOutput
 * @param onConfigureNativeAudio
 */
export function useIOSAudioManagement(
  room: Room,
  preferSpeakerOutput: boolean = true,
  onConfigureNativeAudio?: (
    trackState: AudioTrackState,
    preferSpeakerOutput: boolean
  ) => AppleAudioConfiguration
) {
  const [localTrackCount, setLocalTrackCount] = useState(0);
  const [remoteTrackCount, setRemoteTrackCount] = useState(0);
  const trackState = useMemo(
    () => computeAudioTrackState(localTrackCount, remoteTrackCount),
    [localTrackCount, remoteTrackCount]
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return () => {};
    }

    setLocalTrackCount(getLocalAudioTrackCount(room));
    setRemoteTrackCount(getRemoteAudioTrackCount(room));

    let onLocalPublished = () => {
      setLocalTrackCount(localTrackCount + 1);
    };
    let onLocalUnpublished = () => {
      if (localTrackCount - 1 < 0) {
        log.warn(
          'mismatched local audio track count! attempted to reduce track count below zero.'
        );
      }
      setLocalTrackCount(Math.max(localTrackCount - 1, 0));
    };
    let onRemotePublished = () => {
      setRemoteTrackCount(remoteTrackCount + 1);
    };
    let onRemoteUnpublished = () => {
      if (remoteTrackCount - 1 < 0) {
        log.warn(
          'mismatched remote audio track count! attempted to reduce track count below zero.'
        );
      }
      setRemoteTrackCount(Math.max(remoteTrackCount - 1, 0));
    };

    room
      .on(RoomEvent.LocalTrackPublished, onLocalPublished)
      .on(RoomEvent.LocalTrackUnpublished, onLocalUnpublished)
      .on(RoomEvent.TrackPublished, onRemotePublished)
      .on(RoomEvent.TrackUnpublished, onRemoteUnpublished);

    return () => {
      room
        .off(RoomEvent.LocalTrackPublished, onLocalPublished)
        .off(RoomEvent.LocalTrackUnpublished, onLocalUnpublished)
        .off(RoomEvent.TrackPublished, onRemotePublished)
        .off(RoomEvent.TrackUnpublished, onRemoteUnpublished);
    };
  }, [room, localTrackCount, remoteTrackCount]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    let configFunc =
      onConfigureNativeAudio ?? getDefaultAppleAudioConfigurationForMode;
    let audioConfig = configFunc(trackState, preferSpeakerOutput);

    AudioSession.setAppleAudioConfiguration(audioConfig);
  }, [trackState, onConfigureNativeAudio, preferSpeakerOutput]);
}

function computeAudioTrackState(
  localTracks: number,
  remoteTracks: number
): AudioTrackState {
  if (localTracks > 0 && remoteTracks > 0) {
    return 'localAndRemote';
  } else if (localTracks > 0 && remoteTracks === 0) {
    return 'localOnly';
  } else if (localTracks === 0 && remoteTracks > 0) {
    return 'remoteOnly';
  } else {
    return 'none';
  }
}

function getLocalAudioTrackCount(room: Room): number {
  return room.localParticipant.audioTracks.entries.length;
}

function getRemoteAudioTrackCount(room: Room): number {
  var audioTracks = 0;
  room.participants.forEach((participant) => {
    audioTracks += participant.audioTracks.entries.length;
  });

  return audioTracks;
}
