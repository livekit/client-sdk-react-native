# livekit-react-native

LiveKit Client SDK for React Native. (beta)

## Installation

This library depends on react-native-webrtc's unreleased Transceiver support.
Currently present in our fork.

```sh
yarn add https://github.com/livekit/react-native-webrtc.git#dl/wip-transceiver
yarn add https://github.com/livekit/client-sdk-react-native
```

## Example app

We've included an [example app](example/) that you can try out.

## Usage

In your `index.js` file:

```js
import { registerGlobals } from "livekit-react-native";

// ...

registerGlobals()
```

This sets up the required WebRTC libraries for use in Javascript, and is needed for LiveKit to work.

```js

import { Participant, Room, Track } from 'livekit-client';
import { useRoom, VideoView } from 'livekit-react-native';

/*...*/

const [room,] = useState(() => new Room());
const { participants } = useRoom(room);

useEffect(() => {
  room.connect(url, token, {})
  return () => {
    room.disconnect()
  }
}, [url, token, room]);

const videoView = participants.length > 0 && (
  <VideoView style={{flex:1, width:"100%"}} videoTrack={participants[0].getTrack(Track.Source.Camera)?.videoTrack} />
);
```

## Screenshare

Enabling screenshare requires extra installation steps:

### Android

Android screenshare requires a foreground service with type `mediaProjection` to be present.

The example app uses [@voximplant/react-native-foreground-service](https://github.com/voximplant/react-native-foreground-service) for this.
Ensure that the service is labelled a `mediaProjection` service like so:

```
<service android:name="com.voximplant.foregroundservice.VIForegroundService" 
  android:foregroundServiceType="mediaProjection" />
```

Once setup, start the foreground service prior to using screenshare.

### iOS

iOS screenshare requires adding a Broadcast Extension to your iOS project. Follow the integration instructions here:

https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-ios-sdk/#screen-sharing-integration

It involves copying the files found in this [sample project](https://github.com/jitsi/jitsi-meet-sdk-samples/tree/18c35f7625b38233579ff34f761f4c126ba7e03a/ios/swift-screensharing/JitsiSDKScreenSharingTest/Broadcast%20Extension) 
to your iOS project, and registering a Broadcast Extension in Xcode.

It's also recommended to use [CallKeep](https://github.com/react-native-webrtc/react-native-callkeep), 
to register a call with CallKit (as well as turning on the `voip` background mode).
Due to background app processing limitations, screen recording may be interrupted if the app is restricted
in the background. Registering with CallKit allows the app to continue processing for the duration of the call.

Once setup, iOS screenshare can be initiated like so:

```js
const screenCaptureRef = React.useRef(null);
const screenCapturePickerView = Platform.OS === "ios" && (
  <ScreenCapturePickerView ref={screenCaptureRef} />
);
const startBroadcast = async () => {
  if(Platform.OS === "ios") {
    const reactTag = findNodeHandle(screenCaptureRef.current);
    await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
    room.localParticipant.setScreenShareEnabled(true);
  }
  else {
    room.localParticipant.setScreenShareEnabled(true);
  }
};

return (
  <View style={styles.container}>
    /*...*/
    // Make sure the ScreenCapturePickerView exists in the view tree.
    {screenCapturePickerView}
  </View>
);
```

### Note

Currently it does not run on iOS Simulator on M1 Macs.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Apache License 2.0
