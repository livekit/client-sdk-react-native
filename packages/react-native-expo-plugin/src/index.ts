import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from 'expo-modules-core';

// Import the native module. On web, it will be resolved to LiveKitExpoPlugin.web.ts
// and on native platforms to LiveKitExpoPlugin.ts
import {
  ChangeEventPayload,
  LiveKitExpoPluginViewProps,
} from './LiveKitExpoPlugin.types';
import LiveKitExpoPluginModule from './LiveKitExpoPluginModule';
import LiveKitExpoPluginView from './LiveKitExpoPluginView';

// Get the native constant value.
export const PI = LiveKitExpoPluginModule.PI;

export function hello(): string {
  return LiveKitExpoPluginModule.hello();
}

export async function setValueAsync(value: string) {
  return await LiveKitExpoPluginModule.setValueAsync(value);
}

const emitter = new EventEmitter(
  LiveKitExpoPluginModule ?? NativeModulesProxy.LiveKitExpoPlugin
);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export {
  LiveKitExpoPluginView,
  LiveKitExpoPluginViewProps,
  ChangeEventPayload,
};
