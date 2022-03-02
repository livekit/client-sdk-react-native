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
  micEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
  cameraEnabled: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  screenCastEnabled: boolean;
  setScreenCastEnabled: (enabled: boolean) => void;
  onDisconnectClick: () => void;
  style?: StyleProp<ViewStyle>;
};
export const RoomControls = ({
  micEnabled,
  setMicEnabled,
  cameraEnabled,
  setCameraEnabled,
  onDisconnectClick,
  style,
}: Props) => {
  var micImage = micEnabled
    ? require('./icons/baseline_mic_white_24dp.png')
    : require('./icons/baseline_mic_off_white_24dp.png');
  var cameraImage = cameraEnabled
    ? require('./icons/baseline_videocam_white_24dp.png')
    : require('./icons/baseline_videocam_off_white_24dp.png');

  return (
    <View style={[style, styles.container]}>
      <Pressable
        onPress={() => {
          setMicEnabled(!micEnabled);
        }}
      >
        <Image source={micImage} />
      </Pressable>
      <Pressable
        onPress={() => {
          setCameraEnabled(!cameraEnabled);
        }}
      >
        <Image source={cameraImage} />
      </Pressable>
      <Pressable
        onPress={() => {
          onDisconnectClick();
        }}
      >
        <Image source={require('./icons/baseline_cancel_white_24dp.png')} />
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
  },
});
