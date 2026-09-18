import { Telemetry } from 'livekit-client';
import { AppState, Platform } from 'react-native';
import { version } from '../package.json';

/**
 * The React Native half of client telemetry.
 *
 * `livekit-client` owns the instrumentation — when a connect span starts, what a stats window
 * holds, how a subscribe ends at first media — and this package reuses it unchanged. What it does
 * not reuse is how the records are carried: React Native follows the phones and binds the Rust
 * core (`livekit-telemetry`) through UniFFI, so an app on a device behaves identically whichever
 * LiveKit SDK it was built with, write-ahead file cache included. That lands as a `Backend`
 * implementation installed with `Telemetry.setBackend`; see TELEMETRY.md in `client-sdk-js`.
 *
 * Until then this supplies what a JavaScript runtime can: the platform's name, and the app
 * lifecycle. Thermal state, low power mode and memory pressure never pass through here — the
 * native monitors report them straight to the core, because `livekit-client` has no business
 * knowing a phone gets hot.
 */
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
}
