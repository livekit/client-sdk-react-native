import { Telemetry } from 'livekit-client';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { version } from '../package.json';
import { nativeBatchStore } from './telemetryStorage';

/**
 * The React Native half of client telemetry.
 *
 * `livekit-client` owns the instrumentation — when a connect span starts, what a stats window
 * holds, how a subscribe ends at first media — and this package reuses it unchanged. What it adds
 * is what a phone knows and a browser does not: a filesystem to cache batches in, and a device
 * that gets hot, runs low on memory and asks for less work.
 *
 * None of that vocabulary crosses into `livekit-client`. It receives a `TelemetryStorage` it never
 * inspects, an event name it never interprets, and a cadence factor without a reason attached.
 */

/** What `LK_DEVICE_STATE` carries, in SPEC's names — the native side does the mapping. */
interface NativeDeviceState {
  thermal?: 'nominal' | 'fair' | 'serious' | 'critical';
  lowPower?: boolean;
  memory?: 'normal' | 'warning' | 'critical';
}

/** SPEC's cadence table, for the rows only a device can fill in. Factors multiply, capped at 4×. */
const THERMAL_FACTOR = { nominal: 1, fair: 1, serious: 2, critical: 4 };
const MEMORY_FACTOR = { normal: 1, warning: 2, critical: 4 };

let device: NativeDeviceState = {};

function reportDevice(next: NativeDeviceState) {
  if (next.thermal !== undefined && next.thermal !== device.thermal) {
    Telemetry.emit('lk.device.thermal.changed', {
      'lk.device.thermal.state': next.thermal,
    });
  }
  if (next.lowPower !== undefined && next.lowPower !== device.lowPower) {
    Telemetry.emit('lk.device.low_power.changed', {
      'lk.device.low_power.enabled': next.lowPower,
    });
  }
  if (next.memory !== undefined && next.memory !== device.memory) {
    Telemetry.emit('lk.device.memory.changed', {
      'lk.device.memory.pressure': next.memory,
    });
  }
  device = { ...device, ...next };
  Telemetry.setCadenceFactor(
    Math.min(
      4,
      THERMAL_FACTOR[device.thermal ?? 'nominal'] *
        MEMORY_FACTOR[device.memory ?? 'normal'] *
        (device.lowPower ? 2 : 1)
    )
  );
}

export function registerTelemetry() {
  Telemetry.configure({
    resource: {
      'service.name': 'livekit-client-react-native',
      'service.version': version,
      'os.name': Platform.OS,
      'os.version': String(Platform.Version),
    },
    storage: nativeBatchStore(),
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
  new NativeEventEmitter(native).addListener('LK_DEVICE_STATE', reportDevice);
  // The first state is the promise's answer, not an event: an event sent while this call is still
  // in flight would arrive before the listener above is registered natively, and be dropped.
  native
    .startDeviceStateUpdates()
    .then(reportDevice)
    .catch(() => {});
}
