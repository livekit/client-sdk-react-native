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


### End-to-End Encryption (E2EE)

This example app demonstrates E2EE functionality using the `useRNE2EEManager` hook. You can enable E2EE by toggling it in the pre-join screen and providing an encryption key. When enabled, all audio and video tracks in the room will be end-to-end encrypted.
