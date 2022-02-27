import * as React from 'react';
import { ReactElement, useEffect, useState } from "react"
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleSheet, View, TextInput, Text, Button } from 'react-native';
import type { RootStackParamList } from './App';



export const RoomPage = ({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'RoomPage'>) => {

  return (
    <View style={styles.container}>
      <Text>URL is {route.params.url} </Text>
      <Text>Token is {route.params.token} </Text>
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
