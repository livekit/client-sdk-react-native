import * as React from 'react';

import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import {
  ElementInfo,
  LocalVideoTrack,
  Track,
  TrackEvent,
} from 'livekit-client';
import { RTCView } from '@livekit/react-native-webrtc';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RemoteVideoTrack } from 'livekit-client';
import ViewPortDetector from './ViewPortDetector';
import type { TrackReference } from '@livekit/components-react';

export type VideoTrackProps = {
  trackRef: TrackReference | undefined;
  style?: ViewStyle;
  objectFit?: 'cover' | 'contain' | undefined;
  mirror?: boolean;
  zOrder?: number;
};

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
