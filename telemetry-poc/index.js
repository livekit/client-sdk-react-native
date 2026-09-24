/**
 * @format
 */

// Keep first: `livekit-client` evaluates `class … extends DOMException` at import time, and Hermes
// has no DOMException. `@livekit/react-native`'s own entry point does the same, in the same order.
import '../src/polyfills/DOMException';
import '../src/polyfills/EncoderDecoderTogether.min.js';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
