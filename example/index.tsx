import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { registerGlobals } from 'livekit-react-native';

registerGlobals();
AppRegistry.registerComponent(appName, () => App);
