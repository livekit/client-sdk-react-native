import type { SimulationScenario } from 'livekit-client';
import React from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type Props = {
  onSelect: (scenario: SimulationScenario) => void;
};
export const SimulateScenarioList = ({ onSelect }: Props) => {
  let scenarios: SimulationScenario[] = [
    'signal-reconnect',
    'speaker',
    'node-failure',
    'server-leave',
    'migration',
    'resume-reconnect',
    'force-tcp',
    'force-tls',
    'full-reconnect',
  ];

  let render: ListRenderItem<SimulationScenario> = ({ item }) => {
    return (
      <Pressable
        onPress={() => {
          onSelect(item);
        }}
      >
        <View style={styles.spacer} />
        <Text style={styles.itemTextStyle}>{item}</Text>
        <View style={styles.spacer} />
      </Pressable>
    );
  };
  return (
    <View>
      <Text style={styles.titleTextStyle}>{'Select Simulation'}</Text>
      <View style={styles.spacer} />
      <FlatList
        data={scenarios}
        renderItem={render}
        keyExtractor={(item) => item}
      />
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
  spacer: {
    paddingTop: 10,
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
  titleTextStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
  },
  itemTextStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
  },
});
