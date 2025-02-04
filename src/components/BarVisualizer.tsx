import {
  type AgentState,
  type TrackReferenceOrPlaceholder,
  useMaybeTrackRefContext,
} from '@livekit/components-react';
import {
  Animated,
  StyleSheet,
  View,
  type ColorValue,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import { useMultibandTrackVolume } from '../hooks';
import React, { useEffect, useRef, useState } from 'react';
export type BarVisualizerOptions = {
  /** decimal values from 0 to 1 */
  maxHeight?: number;
  /** decimal values from 0 to 1 */
  minHeight?: number;

  barColor?: ColorValue;
  barWidth?: DimensionValue;
  barBorderRadius?: number;
};

const defaultBarOptions = {
  maxHeight: 1,
  minHeight: 0.2,
  barColor: '#888888',
  barWidth: 24,
  barBorderRadius: 12,
} as const satisfies BarVisualizerOptions;

const sequencerIntervals = new Map<AgentState, number>([
  ['connecting', 2000],
  ['initializing', 2000],
  ['listening', 500],
  ['thinking', 150],
]);

const getSequencerInterval = (
  state: AgentState | undefined,
  barCount: number
): number | undefined => {
  if (state === undefined) {
    return 1000;
  }
  let interval = sequencerIntervals.get(state);
  if (interval) {
    switch (state) {
      case 'connecting':
        // case 'thinking':
        interval /= barCount;
        break;

      default:
        break;
    }
  }
  return interval;
};
/**
 * @beta
 */
export interface BarVisualizerProps {
  /** If set, the visualizer will transition between different voice assistant states */
  state?: AgentState;
  /** Number of bars that show up in the visualizer */
  barCount?: number;
  trackRef?: TrackReferenceOrPlaceholder;
  options?: BarVisualizerOptions;
  /**
   * Custom React Native styles for the container.
   */
  style?: ViewStyle;
}

/**
 * Visualizes audio signals from a TrackReference as bars.
 * If the `state` prop is set, it automatically transitions between VoiceAssistant states.
 * @beta
 *
 * @remarks For VoiceAssistant state transitions this component requires a voice assistant agent running with livekit-agents \>= 0.9.0
 *
 * @example
 * ```tsx
 * function SimpleVoiceAssistant() {
 *   const { state, audioTrack } = useVoiceAssistant();
 *   return (
 *    <BarVisualizer
 *      state={state}
 *      trackRef={audioTrack}
 *    />
 *   );
 * }
 * ```
 */
export const BarVisualizer = ({
  style = {},
  state,
  barCount = 5,
  trackRef,
  options,
}: BarVisualizerProps) => {
  let trackReference = useMaybeTrackRefContext();

  if (trackRef) {
    trackReference = trackRef;
  }

  const opacityAnimations = useRef<Animated.Value[]>([]).current;
  let magnitudes = useMultibandTrackVolume(trackReference, { bands: barCount });

  let opts = { ...defaultBarOptions, ...options };

  const highlightedIndices = useBarAnimator(
    state,
    barCount,
    getSequencerInterval(state, barCount) ?? 100
  );

  useEffect(() => {
    let animations = [];
    for (let i = 0; i < barCount; i++) {
      if (!opacityAnimations[i]) {
        opacityAnimations[i] = new Animated.Value(0.3);
      }
      let targetOpacity = 0.3;
      if (highlightedIndices.includes(i)) {
        targetOpacity = 1;
      }
      animations.push(
        Animated.timing(opacityAnimations[i], {
          toValue: targetOpacity,
          duration: 250,
          useNativeDriver: true,
        })
      );
    }

    let parallel = Animated.parallel(animations);
    parallel.start();
    return () => {
      parallel.stop();
    };
  }, [highlightedIndices, barCount, opacityAnimations]);

  let bars: React.ReactNode[] = [];
  magnitudes.forEach((value, index) => {
    let coerced = Math.min(opts.maxHeight, Math.max(opts.minHeight, value));
    let coercedPercent = Math.min(100, Math.max(0, coerced * 100 + 5));
    let opacity = opacityAnimations[index] ?? new Animated.Value(0.3);
    let barStyle = {
      opacity: opacity,
      backgroundColor: opts.barColor,
      borderRadius: opts.barBorderRadius,
      width: opts.barWidth,
    };
    bars.push(
      <Animated.View
        key={index}
        style={[
          { height: `${coercedPercent}%` },
          barStyle,
          styles.volumeIndicator,
        ]}
      />
    );
  });

  return <View style={{ ...style, ...styles.container }}>{bars}</View>;
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  volumeIndicator: {
    borderRadius: 12,
  },
});

export const useBarAnimator = (
  state: AgentState | undefined,
  columns: number,
  interval: number
): number[] => {
  const [index, setIndex] = useState(0);
  const [sequence, setSequence] = useState<number[][]>([[]]);

  useEffect(() => {
    if (state === 'thinking') {
      setSequence(generateListeningSequenceBar(columns));
    } else if (state === 'connecting' || state === 'initializing') {
      const seq = [...generateConnectingSequenceBar(columns)];
      setSequence(seq);
    } else if (state === 'listening') {
      setSequence(generateListeningSequenceBar(columns));
    } else if (state === undefined) {
      // highlight everything
      setSequence([new Array(columns).fill(0).map((_, idx) => idx)]);
    } else {
      setSequence([[]]);
    }
    setIndex(0);
  }, [state, columns]);

  const animationFrameId = useRef<number | null>(null);
  useEffect(() => {
    let startTime = performance.now();

    const animate = (time: number) => {
      const timeElapsed = time - startTime;

      if (timeElapsed >= interval) {
        setIndex((prev) => prev + 1);
        startTime = time;
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [interval, columns, state, sequence.length]);

  return sequence[index % sequence.length];
};

const generateListeningSequenceBar = (columns: number): number[][] => {
  const center = Math.floor(columns / 2);
  const noIndex = -1;

  return [[center], [noIndex]];
};

const generateConnectingSequenceBar = (columns: number): number[][] => {
  const seq: number[][] = [[]];

  for (let x = 0; x < columns; x++) {
    seq.push([x, columns - 1 - x]);
  }

  return seq;
};
