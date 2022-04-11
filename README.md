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

### Note

Currently it does not run on iOS Simulator on M1 Macs.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Apache License 2.0
