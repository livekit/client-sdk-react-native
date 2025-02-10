import { type TrackReferenceOrPlaceholder } from '@livekit/components-react';
import {
  Track,
  type LocalAudioTrack,
  type RemoteAudioTrack,
} from 'livekit-client';
import { useEffect, useState } from 'react';
import { addListener, removeListener } from '../events/EventEmitter';
import LiveKitModule from '../LKNativeModule';

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

  const mediaStreamTrack = track?.mediaStreamTrack;

  let [volume, setVolume] = useState(0.0);
  useEffect(() => {
    let listener = Object();
    let reactTag: string | null = null;
    if (mediaStreamTrack) {
      reactTag = LiveKitModule.createVolumeProcessor(
        mediaStreamTrack._peerConnectionId ?? -1,
        mediaStreamTrack.id
      );
      addListener(listener, 'LK_VOLUME_PROCESSED', (event: any) => {
        if (event.volume && reactTag && event.id === reactTag) {
          setVolume(event.volume);
        }
      });
    }
    return () => {
      if (mediaStreamTrack) {
        removeListener(listener);
        if (reactTag) {
          LiveKitModule.deleteVolumeProcessor(
            reactTag,
            mediaStreamTrack._peerConnectionId ?? -1,
            mediaStreamTrack.id
          );
        }
      }
    };
  }, [mediaStreamTrack]);

  return volume;
}
