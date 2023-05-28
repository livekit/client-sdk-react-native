import * as React from 'react';
import { useState } from 'react';
import Dialog from 'react-native-dialog';

import {
  StyleSheet,
  View,
  Pressable,
  Image,
  ViewStyle,
  StyleProp,
  Modal,
} from 'react-native';
import { AudioOutputList } from './ui/AudioOutputList';
import type { SimulationScenario } from 'livekit-client';
import { SimulateScenarioList } from './ui/SimulateScenarioList';

export type Props = {
  micEnabled?: boolean;
  setMicEnabled: (enabled: boolean) => void;
  cameraEnabled?: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  switchCamera: () => void;
  screenShareEnabled: boolean;
  setScreenShareEnabled: (enabled: boolean) => void;
  sendData: (message: string) => void;
  onSimulate: (scenario: SimulationScenario) => void;
  onDisconnectClick: () => void;
  style?: StyleProp<ViewStyle>;
};
export const RoomControls = ({
  micEnabled = false,
  setMicEnabled,
  cameraEnabled = false,
  setCameraEnabled,
  switchCamera,
  screenShareEnabled = false,
  setScreenShareEnabled,
  sendData,
  onSimulate,
  onDisconnectClick,
  style,
}: Props) => {
  const [audioModalVisible, setAudioModalVisible] = useState(false);
  const [simulateModalVisible, setSimulateModalVisible] = useState(false);
  var micImage = micEnabled
    ? require('./icons/baseline_mic_white_24dp.png')
    : require('./icons/baseline_mic_off_white_24dp.png');
  var cameraImage = cameraEnabled
    ? require('./icons/baseline_videocam_white_24dp.png')
    : require('./icons/baseline_videocam_off_white_24dp.png');
  var screenShareImage = screenShareEnabled
    ? require('./icons/baseline_cast_connected_white_24dp.png')
    : require('./icons/baseline_cast_white_24dp.png');

  let [message, setMessage] = useState('');
  let [messageDialogVisible, setMessageDialogVisible] = useState(false);
  const handleOk = () => {
    sendData(message);
    setMessageDialogVisible(false);
  };

  const handleCancel = () => {
    setMessageDialogVisible(false);
  };

  return (
    <View style={[style, styles.container]}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={audioModalVisible}
        onRequestClose={() => {
          setAudioModalVisible(!audioModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <AudioOutputList
              onSelect={() => {
                return setAudioModalVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={simulateModalVisible}
        onRequestClose={() => {
          setSimulateModalVisible(!simulateModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <SimulateScenarioList
              onSelect={(simulate) => {
                onSimulate(simulate);
                return setSimulateModalVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>
      <Pressable
        onPress={() => {
          setMicEnabled(!micEnabled);
        }}
      >
        <Image style={styles.icon} source={micImage} />
      </Pressable>
      <Pressable
        onPress={() => {
          setCameraEnabled(!cameraEnabled);
        }}
      >
        <Image style={styles.icon} source={cameraImage} />
      </Pressable>
      <Pressable
        onPress={() => {
          switchCamera();
        }}
      >
        <Image
          style={styles.icon}
          source={require('./icons/camera_flip_outline.png')}
        />
      </Pressable>
      <Pressable
        onPress={() => {
          setScreenShareEnabled(!screenShareEnabled);
        }}
      >
        <Image style={styles.icon} source={screenShareImage} />
      </Pressable>
      <Pressable
        onPress={() => {
          setMessageDialogVisible(true);
        }}
      >
        <Image
          style={styles.icon}
          source={require('./icons/message_outline.png')}
        />
      </Pressable>

      <Pressable
        onPress={() => {
          onDisconnectClick();
        }}
      >
        <Image
          style={styles.icon}
          source={require('./icons/baseline_cancel_white_24dp.png')}
        />
      </Pressable>

      <Pressable
        onPress={() => {
          setAudioModalVisible(true);
        }}
      >
        <Image style={styles.icon} source={require('./icons/speaker.png')} />
      </Pressable>

      <Pressable
        onPress={() => {
          setSimulateModalVisible(true);
        }}
      >
        <Image
          style={styles.icon}
          source={require('./icons/outline_dots_white_24dp.png')}
        />
      </Pressable>

      <Dialog.Container
        visible={messageDialogVisible}
        onBackdropPress={handleCancel}
      >
        <Dialog.Title style={styles.dialogItemTextStyle}>
          Send Message
        </Dialog.Title>
        <Dialog.Input
          style={styles.dialogItemTextStyle}
          onChangeText={setMessage}
        />
        <Dialog.Button label="Cancel" onPress={handleCancel} />
        <Dialog.Button label="Ok" onPress={handleOk} />
      </Dialog.Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginVertical: 8,
  },
  icon: {
    width: 32,
    height: 32,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'black',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  dialogItemTextStyle: {
    color: 'black',
    fontSize: 12,
  },
});
