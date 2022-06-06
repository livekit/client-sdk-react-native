import * as React from 'react';

import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PreJoinPage } from './PreJoinPage';
import { RoomPage } from './RoomPage';
import RNCallKeep from 'react-native-callkeep';
import { Platform } from 'react-native';

const options = {
  ios: {
    appName: 'My app name',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'phone_account_icon',
    additionalPermissions: [],
    // Required to get audio in background when using Android 11
    foregroundService: {
      channelId: 'com.company.my',
      channelName: 'Foreground service for my app',
      notificationTitle: 'My app is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
};

// Only need CallKeep for iOS
if (Platform.OS === 'ios') {
  RNCallKeep.setup(options).then(() => {});
}

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator>
        <Stack.Screen name="PreJoinPage" component={PreJoinPage} />
        <Stack.Screen name="RoomPage" component={RoomPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type RootStackParamList = {
  PreJoinPage: undefined;
  RoomPage: { url: string; token: string };
};
