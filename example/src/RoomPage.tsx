import * as React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleSheet, View, Text, Button } from 'react-native';
import { connect, Room, RoomEvent, VideoPresets } from 'livekit-client'
import type { RootStackParamList } from './App';
import { useEffect, useState } from 'react';
import { LogLevel } from 'livekit-client/dist/logger';



export const RoomPage = ({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {

  const [isConnected, setIsConnected] = useState(false)
  const {url, token} = route.params
  useEffect(() => {

    console.log('going to connect to ', url, " ",token)
    connect(url, token, {logLevel: LogLevel.debug}).then((room) => {
      if (!room) {
        return;
      }
      console.log('connected to ', url, " ",token)
      setIsConnected(true)
      return () => {
        room.disconnect();
        setIsConnected(false)
      };
    });
  }, []);
  return (
    <View style={styles.container}>
      <Text>URL is {route.params.url} </Text>
      <Text>Token is {route.params.token} </Text>
      <Text>Connected state = {isConnected ? "true" : "false"}</Text> 
      <Button
        title='Disconnect'
        onPress={() => {navigation.pop()}}
      />
    </View>
  );
}

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
