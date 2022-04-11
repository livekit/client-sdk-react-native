import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleSheet, View, FlatList, ListRenderItem } from 'react-native';
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { RoomControls } from './RoomControls';
import { ParticipantView } from './ParticipantView';
import { Participant, Room } from 'livekit-client';
import { useRoom } from 'livekit-react-native';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () => new Room({ publishDefaults: { simulcast: false } })
  );
  const { participants } = useRoom(room);

  const { url, token } = route.params;
  useEffect(() => {
    room.connect(url, token, {}).then((r) => {
      if (!r) {
        console.log('failed to connect to ', url, ' ', token);
        return;
      }
      console.log('connected to ', url, ' ', token);
      setIsConnected(true);
    });
    return () => {
      room.disconnect();
    };
  }, [url, token, room]);

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
        screenShareEnabled={room?.localParticipant.isScreenShareEnabled}
        setScreenShareEnabled={(enabled: boolean) => {
          room?.localParticipant.setScreenShareEnabled(enabled);
        }}
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
  },
  otherParticipantsList: {
    width: '100%',
    height: 150,
    flexGrow: 0,
  },
  otherParticipantView: {
    width: 150,
    height: 150,
  },
});
