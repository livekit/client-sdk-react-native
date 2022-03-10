import * as React from 'react';

import {
  StyleSheet,
  View,
  Pressable,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';

export type Props = {
  micEnabled?: boolean;
  setMicEnabled: (enabled: boolean) => void;
  cameraEnabled?: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  screenShareEnabled: boolean;
  setScreenShareEnabled: (enabled: boolean) => void;
  onDisconnectClick: () => void;
  style?: StyleProp<ViewStyle>;
};
export const RoomControls = ({
  micEnabled = false,
  setMicEnabled,
  cameraEnabled = false,
  setCameraEnabled,
  screenShareEnabled = false,
  setScreenShareEnabled,
  onDisconnectClick,
  style,
}: Props) => {
  var micImage = micEnabled
    ? require('./icons/baseline_mic_white_24dp.png')
    : require('./icons/baseline_mic_off_white_24dp.png');
  var cameraImage = cameraEnabled
    ? require('./icons/baseline_videocam_white_24dp.png')
    : require('./icons/baseline_videocam_off_white_24dp.png');
  var screenShareImage = screenShareEnabled
    ? require('./icons/baseline_cast_connected_white_24dp.png')
    : require('./icons/baseline_cast_white_24dp.png')
  return (
    <View style={[style, styles.container]}>
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
          setScreenShareEnabled(!screenShareEnabled);
        }}
      >
        <Image style={styles.icon} source={screenShareImage} />
      </Pressable>
      
      <Pressable
        onPress={() => {
          onDisconnectClick();
        }}
      >
        <Image style={styles.icon} source={require('./icons/baseline_cancel_white_24dp.png')} />
      </Pressable>
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
  }
});
