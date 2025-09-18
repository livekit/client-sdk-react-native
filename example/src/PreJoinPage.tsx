import * as React from 'react';
import { useState, useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  StyleSheet,
  View,
  TextInput,
  Text,
  Button,
  Switch,
} from 'react-native';
import type { RootStackParamList } from './App';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_URL = 'ws://192.168.11.3:7880';
const DEFAULT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjA1MjM4NTksImlkZW50aXR5IjoicGhvbmUiLCJpc3MiOiJBUElUTFdySzh0YndyNDciLCJuYmYiOjE3NTc5MzE4NTksInN1YiI6InBob25lIiwidmlkZW8iOnsicm9vbSI6Im15cm9vbSIsInJvb21Kb2luIjp0cnVlfX0.jpvzL9Mcqu1tS3dpITO-ffAyjzZtEvnq_p9ehD5B7RM';
const DEFAULT_E2EE = false;
const DEFAULT_E2EE_KEY = '';

const URL_KEY = 'url';
const TOKEN_KEY = 'token';
const E2EE_KEY = 'e2eeEnabled';
const E2EE_SHARED_KEY_KEY = 'e2eeSharedKey';

export const PreJoinPage = ({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'PreJoinPage'>) => {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [e2eeEnabled, setE2EE] = useState(DEFAULT_E2EE);
  const [e2eeKey, setE2EEKey] = useState(DEFAULT_E2EE_KEY);
  const toggleE2EE = () => setE2EE((previousState) => !previousState);
  useEffect(() => {
    AsyncStorage.getItem(URL_KEY).then((value) => {
      if (value) {
        setUrl(value);
      }
    });

    AsyncStorage.getItem(TOKEN_KEY).then((value) => {
      if (value) {
        setToken(value);
      }
    });
    AsyncStorage.getItem(E2EE_KEY).then((value) => {
      if (value) {
        setE2EE(value === 'true');
      }
    });
    AsyncStorage.getItem(E2EE_SHARED_KEY_KEY).then((value) => {
      if (value) {
        setE2EEKey(value);
      }
    });
  }, []);

  const { colors } = useTheme();

  let e2eeKeyInputTitle = <Text style={{ color: colors.text }}>E2EE Key</Text>;
  let e2eeKeyInput = (
    <TextInput
      style={{
        color: colors.text,
        borderColor: colors.border,
        ...styles.input,
      }}
      onChangeText={setE2EEKey}
      value={e2eeKey}
    />
  );
  let saveValues = (
    saveUrl: string,
    saveToken: string,
    saveE2EE: boolean,
    saveE2EEKey: string
  ) => {
    AsyncStorage.setItem(URL_KEY, saveUrl);
    AsyncStorage.setItem(TOKEN_KEY, saveToken);
    AsyncStorage.setItem(E2EE_KEY, saveE2EE.toString());
    AsyncStorage.setItem(E2EE_SHARED_KEY_KEY, saveE2EEKey);
  };

  return (
    <View style={styles.container}>
      <Text style={{ color: colors.text }}>URL</Text>
      <TextInput
        style={{
          color: colors.text,
          borderColor: colors.border,
          ...styles.input,
        }}
        onChangeText={setUrl}
        value={url}
      />

      <Text style={{ color: colors.text }}>Token</Text>
      <TextInput
        style={{
          color: colors.text,
          borderColor: colors.border,
          ...styles.input,
        }}
        onChangeText={setToken}
        value={token}
      />

      <Text style={{ color: colors.text }}>Enable E2EE</Text>
      <Switch onValueChange={toggleE2EE} value={e2eeEnabled} />

      <View style={styles.spacer} />

      {e2eeEnabled ? e2eeKeyInputTitle : null}
      {e2eeEnabled ? e2eeKeyInput : null}

      <View style={styles.spacer} />

      <Button
        title="Connect"
        onPress={() => {
          navigation.push('RoomPage', {
            url,
            token,
            e2ee: e2eeEnabled,
            e2eeKey,
          });
        }}
      />

      <View style={styles.spacer} />

      <Button
        title="Save Values"
        onPress={() => {
          saveValues(url, token, e2eeEnabled, e2eeKey);
        }}
      />

      <View style={styles.spacer} />

      <Button
        title="Reset Values"
        onPress={() => {
          saveValues(
            DEFAULT_URL,
            DEFAULT_TOKEN,
            DEFAULT_E2EE,
            DEFAULT_E2EE_KEY
          );
          setUrl(DEFAULT_URL);
          setToken(DEFAULT_TOKEN);
          setE2EE(DEFAULT_E2EE);
          setE2EEKey(DEFAULT_E2EE_KEY);
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
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  input: {
    width: '90%',
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  spacer: {
    height: 10,
  },
});
