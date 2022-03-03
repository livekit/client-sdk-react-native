import * as React from 'react';

import {
  StyleSheet,
  View,
  Pressable,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  ConnectionQuality,
  LocalTrack,
  Participant,
  RemoteTrack,
  Track,
} from "livekit-client";
import { useParticipant } from './useParticipant';
import { RTCView } from 'react-native-webrtc';
export type Props = {
  participant: Participant;
};
export const ParticipantView = ({
  participant
}: Props) => {

  const cameraPublication = participant.getTrack(Track.Source.Camera);
  if (cameraPublication == undefined) {
    console.log("no tracks!")
    return null
  }
  console.log(`displaying url: ${cameraPublication?.videoTrack?.mediaStream?.toURL()}`)
  console.log(`displaying mediaTrack: ${cameraPublication?.videoTrack?.mediaStream}`)
  console.log(`displaying track: ${cameraPublication?.videoTrack}`)
  console.log(`displaying publication: ${cameraPublication}`)
  return (
    <RTCView style={styles.container} streamURL={cameraPublication?.videoTrack?.mediaStream?.toURL()} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#888'
  },
});
