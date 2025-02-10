import { type TrackReferenceOrPlaceholder } from '@livekit/components-react';
import {
  Track,
  type LocalAudioTrack,
  type RemoteAudioTrack,
} from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';
import { addListener, removeListener } from '../events/EventEmitter';
import LiveKitModule from '../LKNativeModule';

/**
 * Interface for configuring options for the useMultibandTrackVolume hook.
 * @alpha
 */
export interface MultiBandTrackVolumeOptions {
  /**
   * the number of bands to split the audio into
   */
  bands?: number;
  /**
   * cut off frequency on the lower end
   */
  minFrequency?: number;
  /**
   * cut off frequency on the higher end
   */
  maxFrequency?: number;
  /**
   * update should run every x ms
   */
  updateInterval?: number;
}

const multibandDefaults = {
  bands: 5,
  minFrequency: 1000,
  maxFrequency: 8000,
  updateInterval: 40,
} as const satisfies MultiBandTrackVolumeOptions;

/**
 * A hook for tracking the volume of an audio track across multiple frequency bands.
 *
 * @param trackOrTrackReference
 * @returns A number array containing the volume for each frequency band.
 */
export function useMultibandTrackVolume(
  trackOrTrackReference?:
    | LocalAudioTrack
    | RemoteAudioTrack
    | TrackReferenceOrPlaceholder,
  options: MultiBandTrackVolumeOptions = {}
) {
  const track =
    trackOrTrackReference instanceof Track
      ? trackOrTrackReference
      : <LocalAudioTrack | RemoteAudioTrack | undefined>(
          trackOrTrackReference?.publication?.track
        );
  const opts = useMemo(() => {
    return { ...multibandDefaults, ...options };
  }, [options]);
  const mediaStreamTrack = track?.mediaStreamTrack;

  let [magnitudes, setMagnitudes] = useState<number[]>([]);
  useEffect(() => {
    let listener = Object();
    let reactTag: string | null = null;
    if (mediaStreamTrack) {
      reactTag = LiveKitModule.createMultibandVolumeProcessor(
        opts,
        mediaStreamTrack._peerConnectionId ?? -1,
        mediaStreamTrack.id
      );
      addListener(listener, 'LK_MULTIBAND_PROCESSED', (event: any) => {
        if (event.magnitudes && reactTag && event.id === reactTag) {
          console.log('event received: ', event.magnitudes[0]);
          setMagnitudes(event.magnitudes);
        }
      });
    }
    return () => {
      if (mediaStreamTrack) {
        removeListener(listener);
        if (reactTag) {
          LiveKitModule.deleteMultibandVolumeProcessor(
            reactTag,
            mediaStreamTrack._peerConnectionId ?? -1,
            mediaStreamTrack.id
          );
        }
      }
    };
  }, [mediaStreamTrack, opts]);

  return magnitudes;
}
