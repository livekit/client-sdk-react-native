import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  findNodeHandle,
  NativeModules,
} from 'react-native';
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { RoomControls } from './RoomControls';
import { ParticipantView } from './ParticipantView';
import {
  DataPacket_Kind,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
} from 'livekit-client';
import { useRoom, useParticipant, AudioSession } from '@livekit/react-native';
import type { TrackPublication } from 'livekit-client';
import { Platform } from 'react-native';
// @ts-ignore
import { mediaDevices, ScreenCapturePickerView } from 'react-native-webrtc';
import { startCallService, stopCallService } from './callservice/CallService';
import Toast from 'react-native-toast-message';

import 'fastestsmallesttextencoderdecoder';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () =>
      new Room({
        publishDefaults: { simulcast: false },
        adaptiveStream: { pixelDensity: 'screen' },
      })
  );
  const { participants } = useRoom(room);
  const { url, token } = route.params;
  const [isCameraFrontFacing, setCameraFrontFacing] = useState(true);

  // Perform platform specific call setup.
  useEffect(() => {
    startCallService();
    return () => {
      stopCallService();
    };
  }, [url, token, room]);

  // Connect to room.
  useEffect(() => {
    let connect = async () => {
      // If you wish to configure audio, uncomment the following:
      // await AudioSession.configureAudio({
      //   android: {
      //     preferredOutputList: ["earpiece"]
      //   },
      //   ios: {
      //     defaultOutput: "earpiece"
      //   }
      // });
      await AudioSession.startAudioSession();
      await room.connect(url, token, {});
      console.log('connected to ', url, ' ', token);
      setIsConnected(true);
    };

    connect();
    return () => {
      room.disconnect();
      AudioSession.stopAudioSession();
    };
  }, [url, token, room]);

  // Setup room listeners
  useEffect(() => {
    const dataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant
    ) => {
      //@ts-ignore
      let decoder = new TextDecoder('utf-8');
      let message = decoder.decode(payload);

      let title = 'Received Message';
      if (participant != null) {
        title = 'Received Message from ' + participant.identity;
      }
      Toast.show({
        type: 'success',
        text1: title,
        text2: message,
      });
    };
    room.on(RoomEvent.DataReceived, dataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, dataReceived);
    };
  });

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

  // Prepare for iOS screenshare.
  const screenCaptureRef = React.useRef(null);
  const screenCapturePickerView = Platform.OS === 'ios' && (
    <ScreenCapturePickerView ref={screenCaptureRef} />
  );
  const startBroadcast = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      room.localParticipant.setScreenShareEnabled(true);
    } else {
      room.localParticipant.setScreenShareEnabled(true);
    }
  };

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
        switchCamera={async () => {
          let facingModeStr = !isCameraFrontFacing ? 'front' : 'environment';
          setCameraFrontFacing(!isCameraFrontFacing);

          let devices = await mediaDevices.enumerateDevices();
          var newDevice;
          //@ts-ignore
          for (const device of devices) {
            //@ts-ignore
            if (
              device.kind === 'videoinput' &&
              device.facing === facingModeStr
            ) {
              newDevice = device;
              break;
            }
          }

          if (newDevice == null) {
            return;
          }

          //@ts-ignore
          await room.switchActiveDevice('videoinput', newDevice.deviceId);
        }}
        screenShareEnabled={isTrackEnabled(screenSharePublication)}
        setScreenShareEnabled={(enabled: boolean) => {
          if (enabled) {
            startBroadcast();
          } else {
            room.localParticipant.setScreenShareEnabled(enabled);
          }
        }}
        sendData={(message: string) => {
          Toast.show({
            type: 'success',
            text1: 'Sending Message',
            text2: message,
          });

          //@ts-ignore
          let encoder = new TextEncoder();
          let encodedData = encoder.encode(message);
          room.localParticipant.publishData(
            encodedData,
            DataPacket_Kind.RELIABLE
          );
        }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
      {screenCapturePickerView}
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
