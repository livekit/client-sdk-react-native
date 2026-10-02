import { getLogger, setLogLevel as setClientSdkLogLevel } from 'livekit-client';

// Registered through `livekit-client`, so this package's warnings and errors reach client
// telemetry the way `livekit-client`'s own do, whatever the console level.
export const log = getLogger('lk-react-native');
log.setDefaultLevel('WARN');

export type LogLevel = Parameters<typeof setClientSdkLogLevel>[0];
export type SetLogLevelOptions = {
  liveKitClientLogLevel?: LogLevel;
};

/**
 * Set the log level for both the `@livekit/react-native` package and the `@livekit-client` package.
 * To set the `@livekit-client` log independently, use the `liveKitClientLogLevel` prop on the `options` object.
 * @public
 */
export function setLogLevel(
  level: LogLevel,
  options: SetLogLevelOptions = {}
): void {
  log.setLevel(level);
  setClientSdkLogLevel(options.liveKitClientLogLevel ?? level);
}
