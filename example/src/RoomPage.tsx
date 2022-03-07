import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleSheet, View, FlatList, ListRenderItem } from 'react-native';
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { LogLevel } from 'livekit-client/dist/logger';
import { RoomControls } from './RoomControls';
import { useRoom } from './useRoom';
import { ParticipantView } from './ParticipantView';
import type { Participant } from 'livekit-client';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const [, setIsConnected] = useState(false);
  const roomState = useRoom();

  const { participants, room } = roomState;
  const { url, token } = route.params;
  useEffect(() => {
    console.log('going to connect to ', url, ' ', token);

    roomState
      .connect(url, token, {
        publishDefaults: { simulcast: false },
        logLevel: LogLevel.info,
      })
      .then((room) => {
        if (!room) {
          return;
        }
        console.log('connected to ', url, ' ', token);
        setIsConnected(true);
        return () => {
          room.disconnect();
        };
      });
  }, [url, token]);

  const stageView = participants.length > 0 && (
    <ParticipantView participant={participants[0]} style={styles.stage} />
  );

  const renderParticipant: ListRenderItem<Participant> = ({ item }) => {
    return (
      <ParticipantView participant={item} style={styles.otherParticipantView} />
    );
  };

  const otherParticipantsView = participants.length > 0 && (
    <FlatList
      data={participants}
      renderItem={renderParticipant}
      keyExtractor={(item) => item.sid}
      horizontal={true}
      style={styles.otherParticipantsList}
    />
  );
  return (
    <View style={styles.container}>
      {stageView}
      {otherParticipantsView}
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
        setScreenCastEnabled={() => {}}
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
  stage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F0',
  },
  otherParticipantsList: {
    width: '100%',
    height: 150,
    flexGrow: 0,
    backgroundColor: '#F00',
  },
  otherParticipantView: {
    width: 150,
    height: 150,
    backgroundColor: '#0F0',
  },
});
