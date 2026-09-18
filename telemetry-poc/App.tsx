/**
 * Telemetry PoC — the integrated pipeline on React Native: `livekit-client`'s telemetry module
 * (the same one a browser runs) plus this SDK's own `src/telemetry.ts` seam, which names the
 * platform and flushes when the app leaves the foreground.
 *
 * The iOS simulator shares the host's network stack, so 127.0.0.1 is the Mac running
 * `otelcol-contrib --config ../../client-sdk-js-telemetry/src/telemetry/otelcol-web.yaml`.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Button, NativeModules, SafeAreaView, ScrollView, Text} from 'react-native';
import {Telemetry} from 'livekit-client';
import {registerTelemetry} from '../src/telemetry';

const endpoint = 'http://127.0.0.1:4320/v1/logs';

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const say = useCallback((line: string) => setLog(prev => [...prev, line]), []);

  // The PoC has no debugger attached, so warnings have to be visible on screen.
  useEffect(() => {
    const warn = console.warn;
    console.warn = (...args: unknown[]) => {
      say(`warn: ${args.map(String).join(' ')}`.slice(0, 200));
      warn(...args);
    };
    return () => {
      console.warn = warn;
    };
  }, [say]);

  const send = useCallback(
    async (encoding: 'protobuf' | 'json') => {
      try {
        // A real app gets the destination from its first Cloud connect; here it is a local
        // collector, named before registerGlobals' seam reports the device it is running on.
        Telemetry.configure({endpoint, encoding, flushInterval: 1});
        registerTelemetry();
        const native = NativeModules.LivekitReactNativeModule;
        say(
          `native module: ${
            native
              ? Object.keys(native)
                  .filter(k => k.toLowerCase().includes('device'))
                  .join(', ') || 'linked, no device methods'
              : 'missing'
          }`,
        );
        await Telemetry.ping(encoding === 'json' ? 2 : 1);
        say(`${encoding}: ${Telemetry.diagnostics()}`);
      } catch (error) {
        say(`${encoding}: ${String(error)}`);
      }
    },
    [say],
  );

  // Ping on mount as well as on tap, so a headless `simctl launch` proves the path on its own.
  useEffect(() => {
    send('protobuf').then(() => send('json'));
  }, [send]);

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
