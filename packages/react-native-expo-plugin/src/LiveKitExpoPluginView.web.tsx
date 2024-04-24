import * as React from 'react';

import { LiveKitExpoPluginViewProps } from './LiveKitExpoPlugin.types';

export default function LiveKitExpoPluginView(
  props: LiveKitExpoPluginViewProps
) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
