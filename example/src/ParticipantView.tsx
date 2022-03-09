import * as React from 'react';

import type { ViewStyle } from 'react-native';
import { Participant, Track } from 'livekit-client';
import { VideoView } from 'livekit-react-native';
export type Props = {
  participant: Participant;
  style?: ViewStyle;
};
export const ParticipantView = ({ style = {}, participant }: Props) => {
  const cameraPublication = participant.getTrack(Track.Source.Camera);
  return <VideoView style={style} videoTrack={cameraPublication?.videoTrack} />;
};
