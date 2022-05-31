import * as React from 'react';

import {
  LayoutChangeEvent,
  PixelRatio,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import type { ElementInfo, VideoTrack } from 'livekit-client';
import { RTCView } from 'react-native-webrtc';
import { useEffect, useState } from 'react';
import { RemoteVideoTrack } from 'livekit-client';
import ViewPortDetector from './ViewPortDetector';

export type Props = {
  videoTrack?: VideoTrack | undefined;
  style?: ViewStyle;
  objectFit?: 'cover' | 'contain' | undefined;
};
export const VideoView = ({
  style = {},
  videoTrack,
  objectFit = 'cover',
}: Props) => {
  const [elementInfo] = useState(() => {
    let info = new VideoViewElementInfo();
    info.id = videoTrack?.sid;
    info.something = videoTrack;
    return info;
  });

  useEffect(() => {
    if (videoTrack instanceof RemoteVideoTrack) {
      videoTrack?.observeElementInfo(elementInfo);
      return () => {
        videoTrack?.stopObservingElementInfo(elementInfo);
      };
    } else {
      return () => {};
    }
  }, [videoTrack, elementInfo]);

  return (
    <View
      style={{ ...style, ...styles.container }}
      onLayout={(event) => {
        elementInfo.onLayout(event);
      }}
    >
      <ViewPortDetector
        onChange={(isVisible: boolean) => elementInfo.onVisibility(isVisible)}
        style={styles.videoView}
      >
        <RTCView
          style={styles.videoView}
          streamURL={videoTrack?.mediaStream?.toURL() ?? ''}
          objectFit={objectFit}
        />
      </ViewPortDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  videoView: {
    flex: 1,
    width: '100%',
  },
});

class VideoViewElementInfo implements ElementInfo {
  element: object = {};
  something?: any;
  id?: string;
  _width = 0;
  _height = 0;
  _observing = false;
  visible: boolean = true;
  visibilityChangedAt: number | undefined;
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
    const pixelRatio = PixelRatio.get();
    this._width = width * pixelRatio;
    this._height = height * pixelRatio;

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
