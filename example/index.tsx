import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { registerGlobals, setLogLevel } from '@livekit/react-native';
import { LogLevel } from 'livekit-client';
import { setupErrorLogHandler } from './src/utils/ErrorLogHandler';
import { setupCallService } from './src/callservice/CallService';

// Logging
setupErrorLogHandler();
setLogLevel(LogLevel.debug);

// Setup for CallService (keep alive in background)
setupCallService();

// Required React-Native setup for app
registerGlobals();
AppRegistry.registerComponent(appName, () => App);
