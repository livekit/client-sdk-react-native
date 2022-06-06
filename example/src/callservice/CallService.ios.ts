import RNCallKeep from 'react-native-callkeep';

let uuid = '1932b99c-4fe1-4bf4-897f-763bc4dc21c2';

// Start a CallKit call on iOS.
// This keeps the app alive in the background.
export async function startCallService() {
  let handle = '1234567';
  let contactIdentifier = 'Caller Contact';
  RNCallKeep.startCall(uuid, handle, contactIdentifier, 'number', true);
}

export async function stopCallService() {
  RNCallKeep.endCall(uuid);
}
