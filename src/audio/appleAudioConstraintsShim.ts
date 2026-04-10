import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

const appleAudioConstraintDefaults = {
  autoGainControl: false,
  echoCancellation: false,
  noiseSuppression: false,
  highpassFilter: false,
} as const;

const getUserMediaShimState = {
  isAppleAudioDefaultsInstalled: false,
  isIOSSimulator: undefined as boolean | undefined,
  isIOSSimulatorPromise: undefined as Promise<boolean> | undefined,
};

// Temporary RN-specific workaround:
// `livekit-client` defaults browser-style software audio processing on, but on
// Apple hardware this SDK uses AudioEngine voice processing. Force software
// EC/AGC/NS/highpass off on Apple hardware until this default can be handled
// upstream at the shared client layer.
export function installAppleAudioConstraintDefaults() {
  if (
    (Platform.OS !== 'ios' && Platform.OS !== 'macos') ||
    getUserMediaShimState.isAppleAudioDefaultsInstalled
  ) {
    return;
  }

  const globalNavigator = (global as typeof globalThis & {
    navigator?: {
      mediaDevices?: {
        getUserMedia?: (constraints: unknown) => Promise<unknown>;
      };
    };
  }).navigator;
  const mediaDevices = globalNavigator?.mediaDevices;
  const originalGetUserMedia = mediaDevices?.getUserMedia?.bind(mediaDevices);

  if (!mediaDevices || !originalGetUserMedia) {
    return;
  }

  mediaDevices.getUserMedia = async (constraints: unknown) => {
    const shouldForceDefaults = await shouldForceAppleAudioDefaultsForDevice();
    return originalGetUserMedia(
      withAppleAudioConstraintDefaults(
        constraints as Record<string, unknown>,
        shouldForceDefaults
      ) as typeof constraints
    );
  };

  getUserMediaShimState.isAppleAudioDefaultsInstalled = true;
}

async function shouldForceAppleAudioDefaultsForDevice(): Promise<boolean> {
  if (Platform.OS === 'macos') {
    return true;
  }

  return !(await isIOSSimulator());
}

function withAppleAudioConstraintDefaults(
  constraints: Record<string, unknown>,
  shouldForceAppleAudioDefaults: boolean
): Record<string, unknown> {
  if (!shouldForceAppleAudioDefaults || !constraints.audio) {
    return constraints;
  }

  if (constraints.audio === true) {
    return {
      ...constraints,
      audio: { ...appleAudioConstraintDefaults },
    };
  }

  if (typeof constraints.audio !== 'object' || constraints.audio === null) {
    return constraints;
  }

  const audioConstraints = constraints.audio as Record<string, unknown>;

  return {
    ...constraints,
    audio: {
      ...audioConstraints,
      ...appleAudioConstraintDefaults,
    },
  };
}

function isIOSSimulator(): Promise<boolean> {
  if (getUserMediaShimState.isIOSSimulator !== undefined) {
    return Promise.resolve(getUserMediaShimState.isIOSSimulator);
  }

  if (getUserMediaShimState.isIOSSimulatorPromise) {
    return getUserMediaShimState.isIOSSimulatorPromise;
  }

  getUserMediaShimState.isIOSSimulatorPromise = detectIOSSimulator().then(
    (value) => {
      getUserMediaShimState.isIOSSimulator = value;
      return value;
    },
    () => {
      getUserMediaShimState.isIOSSimulator = false;
      return false;
    }
  );

  return getUserMediaShimState.isIOSSimulatorPromise;
}

async function detectIOSSimulator(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (typeof DeviceInfo.isEmulatorSync === 'function') {
    return Boolean(DeviceInfo.isEmulatorSync());
  }

  return Boolean(await DeviceInfo.isEmulator());
}
