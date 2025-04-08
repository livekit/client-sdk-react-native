import { type TrackReferenceOrPlaceholder } from '@livekit/components-react';
import {
  Track,
  type LocalAudioTrack,
  type RemoteAudioTrack,
} from 'livekit-client';
import { useEffect, useState } from 'react';
import { addListener, removeListener } from '../events/EventEmitter';
import LiveKitModule from '../LKNativeModule';
import type { MediaStreamTrack } from '@livekit/react-native-webrtc';

/**
 * A hook for tracking the volume of an audio track.
 *
 * @param trackOrTrackReference
 * @returns A number between 0-1 representing the volume.
 */
export function useTrackVolume(
  trackOrTrackReference?:
    | LocalAudioTrack
    | RemoteAudioTrack
    | TrackReferenceOrPlaceholder
) {
  const track =
    trackOrTrackReference instanceof Track
      ? trackOrTrackReference
      : <LocalAudioTrack | RemoteAudioTrack | undefined>(
          trackOrTrackReference?.publication?.track
        );

  const mediaStreamTrack = track?.mediaStreamTrack as
    | MediaStreamTrack
    | undefined;
  const hasMediaStreamTrack = mediaStreamTrack != null;
  const peerConnectionId = mediaStreamTrack?._peerConnectionId ?? -1;
  const mediaStreamTrackId = mediaStreamTrack?.id;

  let [volume, setVolume] = useState(0.0);
  useEffect(() => {
    let listener = Object();
    let reactTag: string | null = null;
    if (hasMediaStreamTrack) {
      reactTag = LiveKitModule.createVolumeProcessor(
        peerConnectionId,
        mediaStreamTrackId
      );
      addListener(listener, 'LK_VOLUME_PROCESSED', (event: any) => {
        if (event.volume && reactTag && event.id === reactTag) {
          setVolume(event.volume);
        }
      });
    }
    return () => {
      if (hasMediaStreamTrack) {
        removeListener(listener);
        if (reactTag) {
          LiveKitModule.deleteVolumeProcessor(
            reactTag,
            peerConnectionId,
            mediaStreamTrackId
          );
        }
      }
    };
  }, [hasMediaStreamTrack, peerConnectionId, mediaStreamTrackId]);

  return volume;
}
