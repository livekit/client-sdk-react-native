import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { LogLevel } from 'livekit-client/dist/logger';
import { registerGlobals } from 'livekit-react-native';
import { setLogLevel } from 'livekit-client';

registerGlobals();
setLogLevel(LogLevel.debug);
AppRegistry.registerComponent(appName, () => App);
