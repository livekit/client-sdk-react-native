import * as React from 'react';

import { StyleSheet, type ViewStyle } from 'react-native';
import {
  isTrackReference,
  type TrackReferenceOrPlaceholder,
  useEnsureTrackRef,
  RTCPIPVideoView,
} from '@livekit/react-native';
import { View } from 'react-native';
export type Props = {
  trackRef: TrackReferenceOrPlaceholder;
  style?: ViewStyle;
  zOrder?: number;
  mirror?: boolean;
};
export const PIPIOS = ({ style = {}, trackRef }: Props) => {
  const trackReference = useEnsureTrackRef(trackRef);
  let videoView;
  if (isTrackReference(trackReference)) {
    const url = trackReference?.publication.track?.mediaStream.toURL();
    videoView = <RTCPIPVideoView style={styles.videoView} streamURL={url} />;
  } else {
    videoView = false;
  }

  return <View style={[styles.container, style]}>{videoView}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00FF00',
  },
  videoView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF0000',
  },
});
