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
  style? : ViewStyle;
};
export const ParticipantView = ({
  style = {},
  participant
}: Props) => {

  const cameraPublication = participant.getTrack(Track.Source.Camera);
  if (cameraPublication == undefined) {
    console.log("no tracks!")
    return <View style={{...style, ...styles.container}} />
  }
  console.log(`displaying url: ${cameraPublication?.videoTrack?.mediaStream?.toURL()}`)
  console.log(`displaying mediaTrack: ${cameraPublication?.videoTrack?.mediaStream}`)
  console.log(`displaying track: ${cameraPublication?.videoTrack}`)
  console.log(`displaying publication: ${cameraPublication}`)
  return (
    <RTCView 
      style={{...style, ...styles.container}} 
      streamURL={cameraPublication?.videoTrack?.mediaStream?.toURL()}
      objectFit="cover" 
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#888'
  },
});
