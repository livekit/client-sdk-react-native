import * as React from 'react';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  StyleSheet,
  View,
  FlatList,
  type ListRenderItem,
  findNodeHandle,
  NativeModules,
} from 'react-native';
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { RoomControls } from './RoomControls';
import { ParticipantView } from './ParticipantView';
import {
  AudioSession,
  useLocalParticipant,
  LiveKitRoom,
  useRoomContext,
  useVisualStableUpdate,
  useTracks,
  type TrackReferenceOrPlaceholder,
  AndroidAudioTypePresets,
  useIOSAudioManagement,
  useRNE2EEManager,
} from '@livekit/react-native';
import { Platform } from 'react-native';
// @ts-ignore
import {
  mediaDevices,
  ScreenCapturePickerView,
} from '@livekit/react-native-webrtc';
import { startCallService, stopCallService } from './callservice/CallService';
import Toast from 'react-native-toast-message';

import { Track } from 'livekit-client';

export const RoomPage = ({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {
  const { url, token, e2ee, e2eeKey } = route.params;
  useEffect(() => {
    let start = async () => {
      // Perform platform specific call setup.
      await startCallService();

      // Configure audio session
      AudioSession.configureAudio({
        android: {
          audioTypeOptions: AndroidAudioTypePresets.communication,
        },
      });
      await AudioSession.startAudioSession();
    };

    start();
    return () => {
      stopCallService();
      AudioSession.stopAudioSession();
    };
  }, []);

  let { e2eeManager } = useRNE2EEManager({
    sharedKey: e2eeKey,
  });
  let e2eeOptions = e2ee ? { e2eeManager } : undefined;

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
        e2ee: e2eeOptions,
      }}
      audio={false}
      video={true}
    >
      <RoomView navigation={navigation} e2ee={e2ee} />
    </LiveKitRoom>
  );
};

interface RoomViewProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RoomPage'>;
  e2ee: boolean;
}

const RoomView = ({ navigation, e2ee }: RoomViewProps) => {
  const [isCameraFrontFacing, setCameraFrontFacing] = useState(true);
  const room = useRoomContext();

  useEffect(() => {
    let setup = async () => {
      if (e2ee) {
        await room.setE2EEEnabled(true);
      }
    };
    setup();
    return () => {};
  }, [room, e2ee]);

  useIOSAudioManagement(room, true);

  // Setup room listeners
  useEffect(() => {
    room.registerTextStreamHandler('lk.chat', async (reader, participant) => {
      let message = await reader.readAll();
      let title = 'Received Message';
      if (participant != null) {
        title = 'Received Message from ' + participant.identity;
      }
      Toast.show({
        type: 'success',
        text1: title,
        text2: message,
      });
    });
  }, [room]);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const stableTracks = useVisualStableUpdate(tracks, 5);
  // Setup views.
  const stageView = tracks.length > 0 && (
    <ParticipantView trackRef={stableTracks[0]} style={styles.stage} />
  );

  const renderParticipant: ListRenderItem<TrackReferenceOrPlaceholder> = ({
    item,
  }) => {
    return (
      <ParticipantView trackRef={item} style={styles.otherParticipantView} />
    );
  };

  const otherParticipantsView = stableTracks.length > 0 && (
    <FlatList
      data={stableTracks}
      renderItem={renderParticipant}
      horizontal={true}
      style={styles.otherParticipantsList}
    />
  );

  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    isScreenShareEnabled,
    localParticipant,
    cameraTrack,
  } = useLocalParticipant();

  // Prepare for iOS screenshare.
  const screenCaptureRef = React.useRef(null);
  const screenCapturePickerView = Platform.OS === 'ios' && (
    <ScreenCapturePickerView ref={screenCaptureRef} />
  );

  const startBroadcast = async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      localParticipant.setScreenShareEnabled(true);
    } else {
      localParticipant.setScreenShareEnabled(true);
    }
  };

  return (
    <View style={styles.container}>
      {stageView}
      {otherParticipantsView}
      <RoomControls
        micEnabled={isMicrophoneEnabled}
        setMicEnabled={(enabled: boolean) => {
          localParticipant.setMicrophoneEnabled(enabled);
        }}
        cameraEnabled={isCameraEnabled}
        setCameraEnabled={(enabled: boolean) => {
          localParticipant.setCameraEnabled(enabled);
        }}
        switchCamera={async () => {
          if (!cameraTrack) {
            return;
          }

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

          if (!newDevice) {
            return;
          }

          await room.switchActiveDevice('videoinput', newDevice.deviceId);
        }}
        screenShareEnabled={isScreenShareEnabled}
        setScreenShareEnabled={(enabled: boolean) => {
          if (enabled) {
            startBroadcast();
          } else {
            localParticipant.setScreenShareEnabled(enabled);
          }
        }}
        sendData={async (message: string) => {
          Toast.show({
            type: 'success',
            text1: 'Sending Message',
            text2: message,
          });

          room.localParticipant.sendText(message, { topic: 'lk.chat' });
        }}
        onSimulate={(scenario) => {
          room.simulateScenario(scenario);
        }}
        onDisconnectClick={() => {
          navigation.pop();
        }}
      />
      {screenCapturePickerView}
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
