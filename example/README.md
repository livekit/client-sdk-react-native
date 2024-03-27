# React Native Example App

## Running

In `client-sdk-react-native` directory, run:

```sh
yarn bootstrap
```

### iOS

To run for iOS, you need the following pre-requisites:

- cocoapods (install from Homebrew)
- Xcode

Generate the Pod project with:

```sh
cd ios
export NO_FLIPPER=1
pod install
```

Then open in Xcode:

```sh
open LivekitReactNativeExample.xcworkspace
```

## Note

This app cannot run on iOS simulator on M1 Macs.

### Android

React Native does not work very well with higher version of JDK. If you run into compilation errors,
try using JDK 17. If you have Android Studio installed, the easiest way is to use the JDK that comes with it. On the Mac, you would set:

```sh
export JAVA_HOME="/Applications/Android\ Studio.app/Contents/jre/Contents/Home"
```

Then run:

```sh
yarn android
```
