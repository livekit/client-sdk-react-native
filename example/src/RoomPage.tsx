import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleSheet, View, FlatList, ListRenderItem } from 'react-native';
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { RoomControls } from './RoomControls';
import { ParticipantView } from './ParticipantView';
import { Participant, Room } from 'livekit-client';
import { useRoom, useParticipant } from 'livekit-react-native';
import type { TrackPublication } from 'livekit-client';
import VIForegroundService from '@voximplant/react-native-foreground-service';
import { Platform } from 'react-native';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () =>
      new Room({
        publishDefaults: { simulcast: false },
        adaptiveStream: true,
      })
  );
  const { participants } = useRoom(room);
  const { url, token } = route.params;

  // Connect to room.
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

  // Start a foreground notification.
  // A foreground notification is required for screenshare on Android.
  useEffect(() => {
    let startService = async () => {
      if (Platform.OS !== 'android') {
        return;
      }

      const channelConfig = {
        id: 'channelId',
        name: 'Call',
        description: '',
        enableVibration: false,
      };
      await VIForegroundService.getInstance().createNotificationChannel(
        channelConfig
      );
      const notificationConfig = {
        channelId: 'channelId',
        id: 3456,
        title: 'LiveKit React Example',
        text: 'Call in progress',
        icon: 'ic_launcher',
      };
      try {
        await VIForegroundService.getInstance().startService(
          notificationConfig
        );
      } catch (e) {
        console.error(e);
      }
    };
    let stopService = async () => {
      if (Platform.OS !== 'android') {
        return;
      }
      await VIForegroundService.getInstance().stopService();
    };
    startService();
    return () => {
      stopService();
    };
  }, [url, token, room]);

  // Setup views.
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

  const { cameraPublication, microphonePublication, screenSharePublication } =
    useParticipant(room.localParticipant);

  return (
    <View style={styles.container}>
      {stageView}
      {otherParticipantsView}
      <RoomControls
        micEnabled={isTrackEnabled(microphonePublication)}
        setMicEnabled={(enabled: boolean) => {
          room.localParticipant.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={isTrackEnabled(cameraPublication)}
        setCameraEnabled={(enabled: boolean) => {
          room.localParticipant.setCameraEnabled(enabled);
        }}
        screenShareEnabled={isTrackEnabled(screenSharePublication)}
        setScreenShareEnabled={(enabled: boolean) => {
          room.localParticipant.setScreenShareEnabled(enabled);
        }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
    </View>
  );
};

function isTrackEnabled(pub?: TrackPublication): boolean {
  return !(pub?.isMuted ?? true);
}

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
