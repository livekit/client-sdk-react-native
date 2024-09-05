import { requireNativeComponent, type ViewProps } from 'react-native';

/**
 * Native prop validation was removed from RN in:
 * https://github.com/facebook/react-native/commit/8dc3ba0444c94d9bbb66295b5af885bff9b9cd34
 *
 * So we list them here for documentation purposes.
 */

interface RTCPIPVideoViewProps extends ViewProps {
  /**
   * URL / id of the stream that should be rendered.
   *
   * streamURL: string
   */
  streamURL?: string;
}

export default requireNativeComponent<RTCPIPVideoViewProps>('RTCPIPVideoView');
