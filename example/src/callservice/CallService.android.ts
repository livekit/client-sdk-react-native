import ReactNativeForegroundService from '@supersami/rn-foreground-service';

// Start a foreground notification on Android.
// A foreground notification is required for screenshare on Android.
export async function startCallService() {
  await ReactNativeForegroundService.start({
    id: 3456,
    title: 'LiveKit React Example',
    message: 'Call in progress',
    importance: 'none',
    vibration: false,
    icon: 'ic_launcher',
  });
}
export async function stopCallService() {
  await ReactNativeForegroundService.stop();
}
