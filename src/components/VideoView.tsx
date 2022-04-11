import * as React from 'react';

import { StyleSheet, ViewStyle } from 'react-native';
import type { VideoTrack } from 'livekit-client';
import { RTCView } from 'react-native-webrtc';
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
  return (
    <RTCView
      style={{ ...style, ...styles.container }}
      streamURL={videoTrack?.mediaStream?.toURL() ?? ''}
      objectFit={objectFit}
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});
