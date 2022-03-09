# livekit-react-native

LiveKit for React Native

## Installation

```sh
npm install react-native-webrtc
npm install livekit-react-native
```

### Pre-release version

```sh
npm install https://github.com/livekit/react-native-webrtc.git#dl/wip-transceiver
npm install https://github.com/livekit/client-sdk-react-native
yarn --cwd node_modules/livekit-client/
yarn --cwd node_modules/livekit-client/ build
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



## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
