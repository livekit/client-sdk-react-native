const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * The PoC imports the SDK's own `src/telemetry.ts` from the repo root (one folder up) and the
 * `livekit-client` build it wraps, so Metro has to watch above the app and resolve both packages
 * to this app's copies.
 */
const config = {
  watchFolders: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../../client-sdk-js-telemetry')],
  resolver: {
    unstable_enableSymlinks: true,
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
      'livekit-client': path.resolve(__dirname, 'node_modules/livekit-client'),
      '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
