<!--BEGIN_BANNER_IMAGE-->

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/.github/banner_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/.github/banner_light.png">
  <img style="width:100%;" alt="The LiveKit icon, the name of the repository and some sample code in the background." src="https://raw.githubusercontent.com/livekit/client-sdk-react-native/main/.github/banner_light.png">
</picture>

<!--END_BANNER_IMAGE-->

# livekit-react-native

<!--BEGIN_DESCRIPTION-->
Use this SDK to add real-time video, audio and data features to your React Native app. By connecting to a self- or cloud-hosted <a href="https://livekit.io/">LiveKit</a> server, you can quickly build applications like interactive live streaming or video calls with just a few lines of code.
<!--END_DESCRIPTION-->

> [!NOTE]
> This is v2 of the React-Native SDK. When migrating from v1.x to v2.x you might encounter a small set of breaking changes.
> Read the [migration guide](https://docs.livekit.io/guides/migrate-from-v1/) for a detailed overview of what has changed.

## Installation

### NPM

```sh
npm install @livekit/react-native @livekit/react-native-webrtc
```

### Yarn

```sh
yarn add @livekit/react-native @livekit/react-native-webrtc
```

This library depends on `@livekit/react-native-webrtc`, which has additional installation instructions found here:

- [iOS Installation Guide](https://github.com/livekit/react-native-webrtc/blob/master/Documentation/iOSInstallation.md)
- [Android Installation Guide](https://github.com/livekit/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md)

---

Once the `@livekit/react-native-webrtc` dependency is installed, one last step is needed to finish the installation:

### Android

In your [MainApplication.java](https://github.com/livekit/client-sdk-react-native/blob/main/example/android/app/src/main/java/com/example/livekitreactnative/MainApplication.java) file:

#### Java
```java
import com.livekit.reactnative.LiveKitReactNative;
import com.livekit.reactnative.audio.AudioType;

public class MainApplication extends Application implements ReactApplication {

  @Override
  public void onCreate() {
    // Place this above any other RN related initialization
    // When AudioType is omitted, it'll default to CommunicationAudioType.
    // Use MediaAudioType if user is only consuming audio, and not publishing.
    LiveKitReactNative.setup(this, new AudioType.CommunicationAudioType());

    //...
  }
}
```

Or in your **MainApplication.kt** if you are using RN 0.73+
#### Kotlin
```kotlin
import com.livekit.reactnative.LiveKitReactNative
import com.livekit.reactnative.audio.AudioType

class MainApplication : Application, ReactApplication() {
  override fun onCreate() {
    // Place this above any other RN related initialization
    // When AudioType is omitted, it'll default to CommunicationAudioType.
    // Use MediaAudioType if user is only consuming audio, and not publishing.
    LiveKitReactNative.setup(this, AudioType.CommunicationAudioType())

    //...
  }
}
```
----

### iOS

In your [AppDelegate.m](https://github.com/livekit/client-sdk-react-native/blob/main/example/ios/LivekitReactNativeExample/AppDelegate.mm) file:

```objc
#import "LivekitReactNative.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Place this above any other RN related initialization
  [LivekitReactNative setup];

  //...
}
```

### Expo

LiveKit is available on Expo through development builds. [See the instructions found here](https://github.com/livekit/client-sdk-react-native/wiki/Expo-Development-Build-Instructions).

## Example app

We've included an [example app](example/) that you can try out.

## Usage

In your `index.js` file, setup the LiveKit SDK by calling `registerGlobals()`.
This sets up the required WebRTC libraries for use in Javascript, and is needed for LiveKit to work.

```js
import { registerGlobals } from '@livekit/react-native';

// ...

registerGlobals();
```

A Room object can then be created and connected to.

```js
import { Participant, Room, Track } from 'livekit-client';
import { useRoom, AudioSession, VideoView } from '@livekit/react-native';

/*...*/

// Create a room state
const [room] = useState(() => new Room());

// Get the participants from the room
const { participants } = useRoom(room);

useEffect(() => {
  let connect = async () => {
    await AudioSession.startAudioSession();
    await room.connect(url, token, {});
    console.log('connected to ', url, ' ', token);
  };
  connect();
  return () => {
    room.disconnect();
    AudioSession.stopAudioSession();
  };
}, [url, token, room]);

const videoView = participants.length > 0 && (
  <VideoView
    style={{ flex: 1, width: '100%' }}
    videoTrack={participants[0].getTrack(Track.Source.Camera)?.videoTrack}
  />
);
```

[API documentation is located here.](https://htmlpreview.github.io/?https://raw.githubusercontent.com/livekit/client-sdk-react-native/main/docs/modules.html)

Additional documentation for the LiveKit SDK can be found at https://docs.livekit.io/references/client-sdks/

## Audio sessions

As seen in the above example, we've introduced a class `AudioSession` that helps
to manage the audio session on native platforms. This class wraps either [AudioManager](https://developer.android.com/reference/android/media/AudioManager) on Android, or [AVAudioSession](https://developer.apple.com/documentation/avfaudio/avaudiosession) on iOS.

You can customize the configuration of the audio session with `configureAudio`.

### Android
#### Media playback

By default, the audio session is set up for bidirectional communication. In this mode, the audio framework exhibits the following behaviors:

- The volume cannot be reduced to 0.
- Echo cancellation is available and is enabled by default.
- A microphone indicator can be displayed, depending on the platform.

If you're leveraging LiveKit primarily for media playback, you have the option to reconfigure the audio session to better suit media playback. Here's how:

```js
useEffect(() => {
  let connect = async () => {
    // configure audio session prior to starting it.
    await AudioSession.configureAudio({
      android: {
        // currently supports .media and .communication presets
        audioTypeOptions: AndroidAudioTypePresets.media,
      },
    });
    await AudioSession.startAudioSession();
    await room.connect(url, token, {});
  };
  connect();
  return () => {
    room.disconnect();
    AudioSession.stopAudioSession();
  };
}, [url, token, room]);
```

#### Customizing audio session

Instead of using our presets, you can further customize the audio session to suit your specific needs.

```js
await AudioSession.configureAudio({
  android: {
    preferredOutputList: ['earpiece'],
    // See [AudioManager](https://developer.android.com/reference/android/media/AudioManager)
    // for details on audio and focus modes.
    audioTypeOptions: {
      manageAudioFocus: true,
      audioMode: 'normal',
      audioFocusMode: 'gain',
      audioStreamType: 'music',
      audioAttributesUsageType: 'media',
      audioAttributesContentType: 'unknown',
    },
  },
});
await AudioSession.startAudioSession();
```

### iOS

For iOS, the most appropriate audio configuration may change over time when local/remote
audio tracks publish and unpublish from the room. To adapt to this, the [`useIOSAudioManagement`](https://htmlpreview.github.io/?https://raw.githubusercontent.com/livekit/client-sdk-react-native/main/docs/functions/useIOSAudioManagement.html)
hook is advised over just configuring the audio session once for the entire audio session.

## Screenshare

Enabling screenshare requires extra installation steps:

### Android

Android screenshare requires a foreground service with type `mediaProjection` to be present.

The example app uses [@voximplant/react-native-foreground-service](https://github.com/voximplant/react-native-foreground-service) for this.
Ensure that the service is labelled a `mediaProjection` service like so:

```xml
<service android:name="com.voximplant.foregroundservice.VIForegroundService" android:foregroundServiceType="mediaProjection" />
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
const screenCapturePickerView = Platform.OS === 'ios' && (
  <ScreenCapturePickerView ref={screenCaptureRef} />
);
const startBroadcast = async () => {
  if (Platform.OS === 'ios') {
    const reactTag = findNodeHandle(screenCaptureRef.current);
    await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
    room.localParticipant.setScreenShareEnabled(true);
  } else {
    room.localParticipant.setScreenShareEnabled(true);
  }
};

return (
  <View style={styles.container}>
    /*...*/ // Make sure the ScreenCapturePickerView exists in the view tree.
    {screenCapturePickerView}
  </View>
);
```

### Note

You will not be able to publish camera or microphone tracks on iOS Simulator.

## Troubleshooting

#### Cannot read properties of undefined (reading 'split')

This error could happen if you are using yarn and have incompatible versions of dependencies with livekit-client.

To fix this, you can either:

- use another package manager, like npm
- use [yarn-deduplicate](https://www.npmjs.com/package/yarn-deduplicate) to deduplicate dependencies

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Apache License 2.0

<!--BEGIN_REPO_NAV-->
<br/><table>
<thead><tr><th colspan="2">LiveKit Ecosystem</th></tr></thead>
<tbody>
<tr><td>Real-time SDKs</td><td><a href="https://github.com/livekit/components-js">React Components</a> · <a href="https://github.com/livekit/client-sdk-js">JavaScript</a> · <a href="https://github.com/livekit/client-sdk-swift">iOS/macOS</a> · <a href="https://github.com/livekit/client-sdk-android">Android</a> · <a href="https://github.com/livekit/client-sdk-flutter">Flutter</a> · <b>React Native</b> · <a href="https://github.com/livekit/client-sdk-rust">Rust</a> · <a href="https://github.com/livekit/client-sdk-python">Python</a> · <a href="https://github.com/livekit/client-sdk-unity-web">Unity (web)</a> · <a href="https://github.com/livekit/client-sdk-unity">Unity (beta)</a></td></tr><tr></tr>
<tr><td>Server APIs</td><td><a href="https://github.com/livekit/server-sdk-js">Node.js</a> · <a href="https://github.com/livekit/server-sdk-go">Golang</a> · <a href="https://github.com/livekit/server-sdk-ruby">Ruby</a> · <a href="https://github.com/livekit/server-sdk-kotlin">Java/Kotlin</a> · <a href="https://github.com/livekit/client-sdk-python">Python</a> · <a href="https://github.com/livekit/client-sdk-rust">Rust</a> · <a href="https://github.com/agence104/livekit-server-sdk-php">PHP (community)</a></td></tr><tr></tr>
<tr><td>Agents Frameworks</td><td><a href="https://github.com/livekit/agents">Python</a> · <a href="https://github.com/livekit/agent-playground">Playground</a></td></tr><tr></tr>
<tr><td>Services</td><td><a href="https://github.com/livekit/livekit">Livekit server</a> · <a href="https://github.com/livekit/egress">Egress</a> · <a href="https://github.com/livekit/ingress">Ingress</a> · <a href="https://github.com/livekit/sip">SIP</a></td></tr><tr></tr>
<tr><td>Resources</td><td><a href="https://docs.livekit.io">Docs</a> · <a href="https://github.com/livekit-examples">Example apps</a> · <a href="https://livekit.io/cloud">Cloud</a> · <a href="https://docs.livekit.io/oss/deployment">Self-hosting</a> · <a href="https://github.com/livekit/livekit-cli">CLI</a></td></tr>
</tbody>
</table>
<!--END_REPO_NAV-->
