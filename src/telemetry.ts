import { Telemetry } from 'livekit-client';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { version } from '../package.json';

/**
 * The React Native half of client telemetry. `livekit-client` carries the whole pipeline — see
 * TELEMETRY.md there — and this supplies what a React Native app knows and a browser does not:
 * which platform this is, when the app is about to stop running, and the device state SPEC's
 * cadence policy needs (thermal, low power, memory pressure), which no web API exposes.
 *
 * Nothing is collected until a destination exists: LiveKit Cloud names one at the first connect,
 * a self-hosted collector needs `Telemetry.configure({ endpoint })`.
 */

/** What `LK_DEVICE_STATE` carries, in SPEC's names — the native side does the mapping. */
interface NativeDeviceState {
  thermal?: 'nominal' | 'fair' | 'serious' | 'critical';
  lowPower?: boolean;
  memory?: 'normal' | 'warning' | 'critical';
}

export function registerTelemetry() {
  Telemetry.configure({
    resource: {
      'service.name': 'livekit-client-react-native',
      'service.version': version,
      'os.name': Platform.OS,
      'os.version': String(Platform.Version),
    },
  });

  // A browser flushes on `visibilitychange`; there is no such event here, so an app leaving the
  // foreground is both the record and the last chance to upload.
  const report = (state: string) =>
    Telemetry.deviceState({
      appState: state === 'active' ? 'foreground' : 'background',
    });
  AppState.addEventListener('change', (state) => {
    report(state);
    if (state !== 'active') {
      Telemetry.flush().catch(() => {});
    }
  });
  report(AppState.currentState ?? 'active');

  const native = NativeModules.LivekitReactNativeModule;
  // An app on an older native build simply reports less; it must not crash.
  if (!native?.startDeviceStateUpdates) {
    return;
  }
  new NativeEventEmitter(native).addListener(
    'LK_DEVICE_STATE',
    (state: NativeDeviceState) => {
      Telemetry.deviceState(state);
    }
  );
  // The first state is the promise's answer, not an event: an event sent while this call is still
  // in flight would arrive before the listener above is registered natively, and be dropped.
  native
    .startDeviceStateUpdates()
    .then((state: NativeDeviceState) => Telemetry.deviceState(state))
    .catch(() => {});
}
