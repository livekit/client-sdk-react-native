import * as React from 'react';

import { Image, StyleSheet, ViewStyle } from 'react-native';
import { Participant, Track } from 'livekit-client';
import { VideoView } from 'livekit-react-native';
import { View } from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
export type Props = {
  participant: Participant;
  style?: ViewStyle;
};
export const ParticipantView = ({ style = {}, participant }: Props) => {
  const cameraPublication =
    participant.getTrack(Track.Source.ScreenShare) ??
    participant.getTrack(Track.Source.Camera);

  const { colors } = useTheme();
  var videoView;
  if (cameraPublication?.isSubscribed) {
    videoView = (
      <VideoView
        style={styles.videoView}
        videoTrack={cameraPublication?.videoTrack}
      />
    );
  } else {
    videoView = (
      <View style={styles.videoView}>
        <View style={styles.spacer} />
        <Image
          style={styles.icon}
          source={require('./icons/baseline_videocam_off_white_24dp.png')}
        />
        <View style={styles.spacer} />
      </View>
    );
  }

  const displayName = participant.name
    ? participant.name
    : participant.identity;
  return (
    <View style={[styles.container, style]}>
      {videoView}
      <View style={styles.identityBar}>
        <Text style={{ color: colors.text }}>{displayName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00153C',
  },
  spacer: {
    flex: 1,
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  identityBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 1,
    padding: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  icon: {
    width: 40,
    height: 40,
    alignSelf: 'center',
  },
});
