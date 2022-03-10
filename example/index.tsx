import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import 'react-native-url-polyfill/auto';
import { registerGlobals } from 'livekit-react-native';
import { setLogLevel } from 'livekit-client';
import { LogLevel } from 'livekit-client/dist/logger';

registerGlobals();
setLogLevel(LogLevel.debug);
AppRegistry.registerComponent(appName, () => App);
