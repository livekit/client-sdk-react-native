// A namespace import read at call time: a `livekit-client` older than the host seam then loads
// without a missing-export error and simply has no telemetry.
import * as client from 'livekit-client';
import type { TelemetryDeviceState, TelemetryHost } from 'livekit-client';
import {
  AppState,
  type AppStateStatus,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { log } from './logger';
import { version } from './version';
import { nativeBatchStore } from './telemetryStorage';

/**
 * The React Native half of client telemetry.
 *
 * `livekit-client` owns the pipeline and the instrumentation — when a connect span starts, what a
 * stats window holds, how a subscribe ends at first media — and this package reuses it unchanged.
 * What it adds is what a phone knows and a browser does not: a filesystem to cache batches in, and
 * a device that goes to the background, gets hot, runs low on memory and asks for less work.
 */

/** What the native side reports, already in SPEC's names; each event carries only what changed. */
export interface NativeDeviceState {
  thermal?: 'nominal' | 'fair' | 'serious' | 'critical';
  lowPower?: boolean;
  memory?: 'normal' | 'warning' | 'critical';
}

const DEVICE_STATE_EVENT = 'LK_DEVICE_STATE';

/**
 * Starts the native thermal, low power and memory pressure observers and forwards every change.
 * The first report is the current state; the rest are deltas. Returns a function that stops the
 * forwarding. An app on an older native build gets no reports, and must not crash.
 */
export function startDeviceState(
  onChange: (change: NativeDeviceState) => void
): () => void {
  const native = NativeModules.LivekitReactNativeModule;
  if (!native?.startDeviceStateUpdates) {
    return () => {};
  }
  let active = true;
  const subscription = new NativeEventEmitter(native).addListener(
    DEVICE_STATE_EVENT,
    onChange
  );
  // The first state is the promise's answer, not an event: an event sent while this call is still
  // in flight would arrive before the listener above is registered natively, and be dropped.
  native
    .startDeviceStateUpdates()
    .then((state: NativeDeviceState) => {
      if (active) {
        onChange(state);
      }
    })
    .catch(() => {});
  return () => {
    active = false;
    subscription.remove();
  };
}

/**
 * Everything this platform can tell the pipeline about the device: the app leaving and entering the
 * foreground (the pipeline flushes on background itself), plus the native thermal, low power and
 * memory state. iOS reports `inactive` for a pulled-down notification shade, which is not the
 * background. Network, battery and audio route are not observed — nothing in this package's
 * dependencies exposes them.
 */
function observeDevice(
  report: (state: TelemetryDeviceState) => void
): () => void {
  const appState = (status: AppStateStatus): TelemetryDeviceState => ({
    appState: status === 'background' ? 'background' : 'foreground',
    // Android never says memory pressure is over; as the Android SDK does, it counts as normal
    // again when the app returns to the foreground. iOS reports the return itself.
    ...(Platform.OS === 'android' && status === 'active'
      ? { memory: 'normal' as const }
      : {}),
  });
  const app = AppState.addEventListener('change', (status) =>
    report(appState(status))
  );
  const stopNative = startDeviceState(report);
  report(appState(AppState.currentState));
  return () => {
    app.remove();
    stopNative();
  };
}

let configured = false;

/**
 * Hands `livekit-client`'s telemetry pipeline this platform's resource names, file cache and device
 * state. Called by {@link registerGlobals}; wired once, and a failure is logged once and dropped so
 * telemetry never stops an app from starting. `endpoint` is for local runs against a collector
 * (see the PR's Local testing) and re-applies the host.
 */
export function registerTelemetry(options: { endpoint?: string } = {}) {
  if (configured && options.endpoint === undefined) {
    return;
  }
  configured = true;
  if (!client.configureTelemetryHost) {
    return;
  }
  try {
    const host: TelemetryHost = {
      sdk: {
        name: 'react-native',
        version,
        os: Platform.OS,
        osVersion: String(Platform.Version),
        // iOS has no model identifier in `Platform.constants`; left to the resource's defaults.
        deviceModel:
          Platform.OS === 'android' ? Platform.constants.Model : undefined,
      },
      storage: nativeBatchStore(),
      observeDevice,
      endpoint: options.endpoint,
    };
    client.configureTelemetryHost(host);
  } catch (error) {
    // Debug, as livekit-client reports its own telemetry failures: warn and error are captured
    // into telemetry, and a telemetry failure must not report itself. A throwing log extension
    // is swallowed too.
    try {
      log.debug('client telemetry is not configured on this platform', error);
    } catch {
      // never into the app
    }
  }
}

/**
 * Opts this process out of client telemetry: `livekit-client`'s `disableTelemetry`, a no-op on a
 * `livekit-client` without it. In effect when the call returns; call it on every start before
 * the first Room.
 *
 * TODO: final shape pending the token/consent discussion.
 */
export function disableTelemetry(): void {
  client.disableTelemetry?.();
}
