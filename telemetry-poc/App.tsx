/**
 * Telemetry PoC — the same `src/telemetry/index.ts` that `livekit-client` runs in a browser,
 * copied verbatim, sending one `lk.ping` from Hermes at the collector on the host
 * (`otelcol-contrib --config .../otelcol-web.yaml`, port 4320, fanning out to Grafana LGTM).
 *
 * The iOS simulator shares the host's network stack, so 127.0.0.1 is the Mac.
 */
import React, {useCallback, useState} from 'react';
import {Button, SafeAreaView, ScrollView, Text} from 'react-native';
import {ping} from './src/telemetry';

const endpoint = 'http://127.0.0.1:4320/v1/logs';
const resource = {
  'service.name': 'livekit-client-react-native',
  'service.version': '0.0.0-poc',
  'os.name': 'ios',
};

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const say = useCallback((line: string) => setLog(prev => [...prev, line]), []);

  const send = useCallback(
    async (encoding: 'protobuf' | 'json') => {
      try {
        const delivery = await ping({endpoint, resource, encoding}, encoding === 'json' ? 2 : 1);
        say(`${encoding}: status ${delivery.status}, ${delivery.bytes} bytes`);
      } catch (error) {
        say(`${encoding}: ${String(error)}`);
      }
    },
    [say],
  );

  return (
    <SafeAreaView>
      <Button title="ping (protobuf)" onPress={() => send('protobuf')} />
      <Button title="ping (json)" onPress={() => send('json')} />
      <ScrollView>
        {log.map((line, index) => (
          <Text key={index}>{line}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
