# React Native Example App

## Running

In `client-sdk-react-native` directory, run:

```sh
yarn bootstrap
```

### iOS

To run for iOS, you need the following pre-requisites:

* cocoapods (install from Homebrew)
* Xcode

Generate the Pod project with:

```sh
cd ios
pod install
```

Then open in Xcode:

```sh
open LivekitReactNativeExample.xcworkspace
```

## Note

This app cannot run on iOS simulator on M1 Macs.

### Android

```sh
yarn android
```
