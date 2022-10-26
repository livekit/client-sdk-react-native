import VIForegroundService from '@voximplant/react-native-foreground-service';

// Start a foreground notification on Android.
// A foreground notification is required for screenshare on Android.
export async function startCallService() {
  const channelConfig = {
    id: 'channelId',
    name: 'Call',
    description: '',
    enableVibration: false,
  };
  await VIForegroundService.getInstance().createNotificationChannel(
    channelConfig
  );
  const notificationConfig = {
    channelId: 'channelId',
    id: 3456,
    title: 'LiveKit React Example',
    text: 'Call in progress',
    icon: 'ic_launcher',
  };
  try {
    await VIForegroundService.getInstance().startService(notificationConfig);
  } catch (e) {
    console.error(e);
  }
}
export async function stopCallService() {
  await VIForegroundService.getInstance().stopService();
}
