import * as React from 'react';

import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  type ElementInfo,
  LocalVideoTrack,
  Track,
  TrackEvent,
} from 'livekit-client';
import { RTCView } from '@livekit/react-native-webrtc';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RemoteVideoTrack } from 'livekit-client';
import ViewPortDetector from './ViewPortDetector';
import type { TrackReference } from '@livekit/components-react';

/**
 * Props for the VideoTrack component.
 * @public
 */
export type VideoTrackProps = {
  /**
   * The track reference to display. This should be a TrackReference object
   * or undefined if no track is available.
   */
  trackRef: TrackReference | undefined;
  /**
   * Custom React Native styles for the video container.
   */
  style?: ViewStyle;
  /**
   * Specifies how the video content should be resized to fit its container.
   * 'cover' (default): The video will fill the entire container, potentially cropping the video.
   * 'contain': The entire video will be visible within the container, potentially leaving empty space.
   */
  objectFit?: 'cover' | 'contain' | undefined;
  /**
   * Indicates whether the video should be mirrored during rendering.
   * This is commonly used for front-facing cameras.
   */
  mirror?: boolean;
  /**
   * Specifies the depth-stacking order of this video view in the stacking space of all video views.
   * A larger zOrder value generally causes the view to cover those with lower values.
   *
   * The support for zOrder is platform-dependent and/or
   * implementation-specific. Thus, specifying a value for zOrder is to be
   * thought of as giving a hint rather than as imposing a requirement. For
   * example, video renderers such as RTCView are commonly implemented using
   * OpenGL and OpenGL views may have different numbers of layers in their
   * stacking space. Android has three: a layer bellow the window (aka
   * default), a layer bellow the window again but above the previous layer
   * (aka media overlay), and above the window. Consequently, it is advisable
   * to limit the number of utilized layers in the stacking space to the
   * minimum sufficient for the desired display. For example, a video call
   * application usually needs a maximum of two zOrder values: 0 for the
   * remote video(s) which appear in the background, and 1 for the local
   * video(s) which appear above the remote video(s).
   */
  zOrder?: number;
};

/**
 * VideoTrack component for displaying video tracks in a React Native application.
 * It supports both local and remote video tracks from LiveKit, and handles adaptive streaming for remote tracks.
 *
 * @param props - See VideoTrackProps for details.
 * @returns A React component that renders the given video track.
 * @public
 */
export const VideoTrack = ({
  style = {},
  trackRef,
  objectFit = 'cover',
  zOrder,
  mirror,
}: VideoTrackProps) => {
  const [elementInfo] = useState(() => {
    let info = new VideoTrackElementInfo();
    info.id = trackRef?.publication?.trackSid;
    return info;
  });

  const layoutOnChange = useCallback(
    (event: LayoutChangeEvent) => elementInfo.onLayout(event),
    [elementInfo]
  );
  const visibilityOnChange = useCallback(
    (isVisible: boolean) => elementInfo.onVisibility(isVisible),
    [elementInfo]
  );

  const videoTrack = trackRef?.publication.track;

  const shouldObserveVisibility = useMemo(() => {
    return (
      videoTrack instanceof RemoteVideoTrack && videoTrack.isAdaptiveStream
    );
  }, [videoTrack]);

  const [mediaStream, setMediaStream] = useState(videoTrack?.mediaStream);
  useEffect(() => {
    setMediaStream(videoTrack?.mediaStream);
    if (videoTrack instanceof LocalVideoTrack) {
      const onRestarted = (track: Track | null) => {
        setMediaStream(track?.mediaStream);
      };
      videoTrack.on(TrackEvent.Restarted, onRestarted);

      return () => {
        videoTrack.off(TrackEvent.Restarted, onRestarted);
      };
    } else {
      return () => {};
    }
  }, [videoTrack]);

  useEffect(() => {
    if (videoTrack instanceof RemoteVideoTrack && videoTrack.isAdaptiveStream) {
      videoTrack?.observeElementInfo(elementInfo);
      return () => {
        videoTrack?.stopObservingElementInfo(elementInfo);
      };
    } else {
      return () => {};
    }
  }, [videoTrack, elementInfo]);

  return (
    <View style={{ ...style, ...styles.container }} onLayout={layoutOnChange}>
      <ViewPortDetector
        onChange={visibilityOnChange}
        style={styles.videoTrack}
        disabled={!shouldObserveVisibility}
        propKey={videoTrack}
      >
        <RTCView
          style={styles.videoTrack}
          streamURL={mediaStream?.toURL() ?? ''}
          objectFit={objectFit}
          zOrder={zOrder}
          mirror={mirror}
        />
      </ViewPortDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  videoTrack: {
    flex: 1,
    width: '100%',
  },
});

class VideoTrackElementInfo implements ElementInfo {
  element: object = {};
  something?: any;
  id?: string;
  _width = 0;
  _height = 0;
  _observing = false;
  visible: boolean = true;
  visibilityChangedAt: number | undefined;
  pictureInPicture = false;
  handleResize?: (() => void) | undefined;
  handleVisibilityChanged?: (() => void) | undefined;
  width = () => this._width;
  height = () => this._height;

  observe(): void {
    this._observing = true;
  }

  stopObserving(): void {
    this._observing = false;
  }

  onLayout(event: LayoutChangeEvent) {
    let { width, height } = event.nativeEvent.layout;
    this._width = width;
    this._height = height;

    if (this._observing) {
      this.handleResize?.();
    }
  }

  onVisibility(isVisible: boolean) {
    if (this.visible !== isVisible) {
      this.visible = isVisible;
      this.visibilityChangedAt = Date.now();
      if (this._observing) {
        this.handleVisibilityChanged?.();
      }
    }
  }
}
