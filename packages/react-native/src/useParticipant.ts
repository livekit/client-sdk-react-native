import {
  ConnectionQuality,
  LocalParticipant,
  Participant,
  ParticipantEvent,
  Track,
  TrackPublication,
} from 'livekit-client';
import { useEffect, useState } from 'react';

/** @deprecated use `useRemoteParticipant` or `useLocalParticipant` instead */
export interface ParticipantState {
  isSpeaking: boolean;
  connectionQuality: ConnectionQuality;
  isLocal: boolean;
  metadata?: string;
  publications: TrackPublication[];
  subscribedTracks: TrackPublication[];
  cameraPublication?: TrackPublication;
  microphonePublication?: TrackPublication;
  screenSharePublication?: TrackPublication;
}
/** @deprecated use `useRemoteParticipant` or `useLocalParticipant` instead */
export function useParticipant(participant: Participant): ParticipantState {
  const [isAudioMuted, setAudioMuted] = useState(false);
  const [, setVideoMuted] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    participant.connectionQuality
  );
  const [isSpeaking, setSpeaking] = useState(false);
  const [metadata, setMetadata] = useState<string>();
  const [publications, setPublications] = useState<TrackPublication[]>([]);
  const [subscribedTracks, setSubscribedTracks] = useState<TrackPublication[]>(
    []
  );

  const [cameraPublication, setCameraPublication] = useState(
    participant.getTrackPublication(Track.Source.Camera)
  );
  const [microphonePublication, setMicrophonePublication] = useState(
    participant.getTrackPublication(Track.Source.Microphone)
  );
  const [screenSharePublication, setScreenSharePublication] = useState(
    participant.getTrackPublication(Track.Source.ScreenShare)
  );
  useEffect(() => {
    const onPublicationsChanged = () => {
      setPublications(Array.from(participant.trackPublications.values()));
      setCameraPublication(
        participant.getTrackPublication(Track.Source.Camera)
      );
      setMicrophonePublication(
        participant.getTrackPublication(Track.Source.Microphone)
      );
      setScreenSharePublication(
        participant.getTrackPublication(Track.Source.ScreenShare)
      );
      setSubscribedTracks(
        Array.from(participant.trackPublications.values()).filter((pub) => {
          return pub.isSubscribed && pub.track !== undefined;
        })
      );
    };
    const onMuted = (pub: TrackPublication) => {
      if (pub.kind === Track.Kind.Audio) {
        setAudioMuted(true);
      } else if (pub.kind === Track.Kind.Video) {
        setVideoMuted(true);
      }
    };
    const onUnmuted = (pub: TrackPublication) => {
      if (pub.kind === Track.Kind.Audio) {
        setAudioMuted(false);
      } else if (pub.kind === Track.Kind.Video) {
        setVideoMuted(false);
      }
    };
    const onMetadataChanged = () => {
      if (participant.metadata) {
        setMetadata(participant.metadata);
      }
    };
    const onIsSpeakingChanged = () => {
      setSpeaking(participant.isSpeaking);
    };
    const onConnectionQualityUpdate = () => {
      setConnectionQuality(participant.connectionQuality);
    };

    // register listeners
    participant
      .on(ParticipantEvent.TrackMuted, onMuted)
      .on(ParticipantEvent.TrackUnmuted, onUnmuted)
      .on(ParticipantEvent.ParticipantMetadataChanged, onMetadataChanged)
      .on(ParticipantEvent.IsSpeakingChanged, onIsSpeakingChanged)
      .on(ParticipantEvent.TrackPublished, onPublicationsChanged)
      .on(ParticipantEvent.TrackUnpublished, onPublicationsChanged)
      .on(ParticipantEvent.TrackSubscribed, onPublicationsChanged)
      .on(ParticipantEvent.TrackUnsubscribed, onPublicationsChanged)
      .on(ParticipantEvent.LocalTrackPublished, onPublicationsChanged)
      .on(ParticipantEvent.LocalTrackUnpublished, onPublicationsChanged)
      .on(ParticipantEvent.ConnectionQualityChanged, onConnectionQualityUpdate);

    // set initial state
    onMetadataChanged();
    onIsSpeakingChanged();
    onPublicationsChanged();

    return () => {
      // cleanup
      participant
        .off(ParticipantEvent.TrackMuted, onMuted)
        .off(ParticipantEvent.TrackUnmuted, onUnmuted)
        .off(ParticipantEvent.ParticipantMetadataChanged, onMetadataChanged)
        .off(ParticipantEvent.IsSpeakingChanged, onIsSpeakingChanged)
        .off(ParticipantEvent.TrackPublished, onPublicationsChanged)
        .off(ParticipantEvent.TrackUnpublished, onPublicationsChanged)
        .off(ParticipantEvent.TrackSubscribed, onPublicationsChanged)
        .off(ParticipantEvent.TrackUnsubscribed, onPublicationsChanged)
        .off(ParticipantEvent.LocalTrackPublished, onPublicationsChanged)
        .off(ParticipantEvent.LocalTrackUnpublished, onPublicationsChanged)
        .off(
          ParticipantEvent.ConnectionQualityChanged,
          onConnectionQualityUpdate
        );
    };
  }, [participant]);

  let muted: boolean | undefined;
  participant.audioTrackPublications.forEach((pub) => {
    muted = pub.isMuted;
  });
  if (muted === undefined) {
    muted = true;
  }
  if (isAudioMuted !== muted) {
    setAudioMuted(muted);
  }

  return {
    isLocal: participant instanceof LocalParticipant,
    isSpeaking,
    connectionQuality,
    publications,
    subscribedTracks,
    cameraPublication,
    microphonePublication,
    screenSharePublication,
    metadata,
  };
}
