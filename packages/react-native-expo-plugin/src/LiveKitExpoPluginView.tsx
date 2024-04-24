import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { LiveKitExpoPluginViewProps } from './LiveKitExpoPlugin.types';

const NativeView: React.ComponentType<LiveKitExpoPluginViewProps> =
  requireNativeViewManager('LiveKitExpoPlugin');

export default function LiveKitExpoPluginView(
  props: LiveKitExpoPluginViewProps
) {
  return <NativeView {...props} />;
}
