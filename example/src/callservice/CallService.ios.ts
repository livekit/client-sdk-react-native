// Start a CallKit call on iOS.

import RNCallKeep, {
  AudioSessionCategoryOption,
  AudioSessionMode,
} from 'react-native-callkeep';

import { RTCAudioSession } from '@livekit/react-native-webrtc';

let uuid = '1932b99c-4fe1-4bf4-897f-763bc4dc21c2';

// This keeps the app alive in the background.
export async function startCallService() {
  let handle = '1234567';
  let contactIdentifier = 'Caller Contact';
  RNCallKeep.startCall(uuid, handle, contactIdentifier, 'number', true);
}

export async function stopCallService() {
  RNCallKeep.endCall(uuid);
}

export function setupCallService() {
  // iOS CallKit setup
  const options = {
    ios: {
      appName: 'LiveKitReactNative',
      includeCallsInRecents: false,
      audioSession: {
        categoryOptions:
          AudioSessionCategoryOption.allowAirPlay +
          AudioSessionCategoryOption.allowBluetooth +
          AudioSessionCategoryOption.allowBluetoothA2DP +
          AudioSessionCategoryOption.defaultToSpeaker,
        mode: AudioSessionMode.videoChat,
      },
    },
    // Android isn't used, but these fields are required for type safety.
    android: {
      alertTitle: 'Permissions required',
      alertDescription: 'This application needs to access your phone accounts',
      cancelButton: 'Cancel',
      okButton: 'Ok',
      imageName: 'phone_account_icon',
      additionalPermissions: [],
      foregroundService: {
        channelId: 'io.livekit.reactnative',
        channelName: 'Foreground Service',
        notificationTitle:
          'LiveKit React Native Example is running in the background',
      },
    },
  };
  RNCallKeep.setSettings(options);
  RNCallKeep.addEventListener('didChangeAudioRoute', () => {}); // To quell warnings.

  // For apps handling incoming calls from the background.
  RNCallKeep.addEventListener('didActivateAudioSession', () => {
    RTCAudioSession.audioSessionDidActivate();
  });
  RNCallKeep.addEventListener('didDeactivateAudioSession', () => {
    RTCAudioSession.audioSessionDidDeactivate();
  });
}
