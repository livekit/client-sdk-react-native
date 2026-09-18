import { Telemetry } from 'livekit-client';
import { AppState, Platform } from 'react-native';
import { version } from '../package.json';

/**
 * The React Native half of client telemetry. `livekit-client` carries the whole pipeline — see
 * TELEMETRY.md there — and this supplies the two things a React Native app knows and a browser
 * does not: which platform this is, and when the app is about to stop running.
 *
 * A browser flushes on `visibilitychange`; there is no such event here, so `AppState` leaving
 * `active` is the last chance to upload. Nothing is collected until a destination exists: LiveKit
 * Cloud names one at the first connect, a self-hosted collector needs
 * `Telemetry.configure({ endpoint })`.
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
  AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      Telemetry.flush().catch(() => {});
    }
  });
}
