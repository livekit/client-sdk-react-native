import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleSheet, View, Text, Button } from 'react-native';
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { LogLevel } from 'livekit-client/dist/logger';
import { RoomControls } from './RoomControls';
import { useRoom } from './useRoom';
import { ParticipantView } from './ParticipantView';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const [isConnected, setIsConnected] = useState(false);
  const roomState = useRoom();

  const { participants, room } = roomState;
  const { url, token } = route.params;
  useEffect(() => {
    console.log('going to connect to ', url, ' ', token);

    roomState.connect(url, token, { logLevel: LogLevel.info }).then((room) => {
      if (!room) {
        return;
      }
      console.log('connected to ', url, ' ', token);
      setIsConnected(true);
      return () => {
        room.disconnect();
        setIsConnected(false);
      };
    });
  }, [url, token]);
  return (
    <View style={styles.container}>
      <Text>URL is {route.params.url} </Text>
      <Text>Token is {route.params.token} </Text>
      <Text>Connected state = {isConnected ? 'true' : 'false'}</Text>
      {
        participants.length > 0 && (<ParticipantView participant={participants[0]}/>)
      }
      <RoomControls
        micEnabled={room?.localParticipant.isMicrophoneEnabled}
        setMicEnabled={(enabled: boolean) => {
          room?.localParticipant.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={room?.localParticipant.isCameraEnabled}
        setCameraEnabled={(enabled: boolean) => {
          room?.localParticipant.setCameraEnabled(enabled);
        }}
        screenCastEnabled={false}
        setScreenCastEnabled={() => { }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
