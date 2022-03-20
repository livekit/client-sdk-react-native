# livekit-react-native

LiveKit for React Native.

## Installation

```sh
npm install react-native-webrtc
npm install livekit-react-native
```

### Pre-release version

```sh
npm install https://github.com/livekit/react-native-webrtc.git#dl/wip-transceiver
# This will have some errors, this is expected.
npm install https://github.com/livekit/client-sdk-react-native

# Fix errors
yarn --cwd node_modules/livekit-client/
yarn --cwd node_modules/livekit-client/ build

# Should complete successfully now.
npm install
```

## Usage

In your `index.js` file:

```js
import { registerGlobals } from "livekit-react-native";

// ...

registerGlobals()
```

This sets up the required WebRTC libraries for use in Javascript, and is needed for LiveKit to work.

```js

import { Participant, Room } from 'livekit-client';
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
  <VideoView videoTrack={participants[0].getTrack(Track.Source.Camera)?.videoTrack} />
);
```
## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
