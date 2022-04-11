import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { registerGlobals } from 'livekit-react-native';
import { setLogLevel } from 'livekit-client';

registerGlobals();
setLogLevel(1);
AppRegistry.registerComponent(appName, () => App);
