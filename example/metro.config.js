const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = (async () => {
  const { withMetroConfig } = await import('react-native-monorepo-config');
  const defaultConfig = await getDefaultConfig(__dirname);

  const config = withMetroConfig(defaultConfig, {
    root,
    dirname: __dirname,
  });

  config.resolver.unstable_enablePackageExports = true;
  return config;
})();
