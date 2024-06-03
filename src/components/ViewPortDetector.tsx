'use strict';

import React, { Component, type PropsWithChildren } from 'react';
import {
  AppState,
  type AppStateStatus,
  type NativeEventSubscription,
  View,
  type ViewStyle,
} from 'react-native';

const DEFAULT_DELAY = 1000;

export type Props = {
  disabled?: boolean;
  style?: ViewStyle;
  onChange?: (isVisible: boolean) => void;
  delay?: number;
  propKey?: any;
};

class TimeoutHandler {
  private handlerRef: { id: any } = { id: -1 };

  get handler(): any {
    return this.handlerRef.id;
  }
  set handler(n: any) {
    this.handlerRef.id = n;
  }

  clear() {
    clearTimeout(this.handlerRef.id as any);
  }
}

function setIntervalWithTimeout(
  callback: (clear: () => void) => any,
  intervalMs: number,
  handleWrapper = new TimeoutHandler()
): TimeoutHandler {
  let cleared = false;

  const timeout = () => {
    handleWrapper.handler = setTimeout(() => {
      callback(() => {
        cleared = true;
        handleWrapper.clear();
      });
      if (!cleared) {
        timeout();
      }
    }, intervalMs);
  };
  timeout();
  return handleWrapper;
}

/**
 * Detects when this is in the viewport and visible.
 *
 * Will not fire visibility changes for zero width/height components.
 */
export default class ViewPortDetector extends Component<
  PropsWithChildren<Props>
> {
  private lastValue: boolean | null = null;
  private interval: TimeoutHandler | null = null;
  private view: View | null = null;
  private lastAppStateActive = false;
  private appStateSubscription: NativeEventSubscription | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { rectTop: 0, rectBottom: 0 };
  }

  componentDidMount() {
    this.lastAppStateActive = AppState.currentState === 'active';
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
    if (this.hasValidTimeout(this.props.disabled, this.props.delay)) {
      this.startWatching();
    }
  }

  componentWillUnmount() {
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.stopWatching();
  }

  hasValidTimeout = (disabled?: boolean, delay?: number): boolean => {
    let disabledValue = disabled ?? false;
    let delayValue = delay ?? DEFAULT_DELAY;
    return (
      AppState.currentState === 'active' && !disabledValue && delayValue > 0
    );
  };

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (!this.hasValidTimeout(nextProps.disabled, nextProps.delay)) {
      this.stopWatching();
    } else {
      if (this.props.propKey !== nextProps.propKey) {
        this.lastValue = null;
      }
      this.startWatching();
    }
  }
  handleAppStateChange = (nextAppState: AppStateStatus) => {
    let nextAppStateActive = nextAppState === 'active';
    if (this.lastAppStateActive !== nextAppStateActive) {
      this.checkVisibility();
    }
    this.lastAppStateActive = nextAppStateActive;

    if (!this.hasValidTimeout(this.props.disabled, this.props.delay)) {
      this.stopWatching();
    } else {
      this.startWatching();
    }
  };

  startWatching = () => {
    if (this.interval) {
      return;
    }
    this.interval = setIntervalWithTimeout(
      this.checkVisibility,
      this.props.delay || DEFAULT_DELAY
    );
  };

  stopWatching = () => {
    this.interval?.clear();
    this.interval = null;
  };

  checkVisibility = () => {
    if (!this.view) {
      return;
    }

    if (AppState.currentState !== 'active') {
      this.updateVisibility(false);
      return;
    }

    this.view.measure((_x, _y, width, height, _pageX, _pageY) => {
      this.checkInViewPort(width, height);
    });
  };
  checkInViewPort = (width?: number, height?: number) => {
    let isVisible: boolean;
    // Not visible if any of these are missing.
    if (!width || !height) {
      isVisible = false;
    } else {
      isVisible = true;
    }
    this.updateVisibility(isVisible);
  };

  updateVisibility = (isVisible: boolean) => {
    if (this.lastValue !== isVisible) {
      this.lastValue = isVisible;
      this.props.onChange?.(isVisible);
    }
  };
  render() {
    return (
      <View
        collapsable={false}
        ref={(component) => {
          this.view = component;
        }}
        {...this.props}
      >
        {this.props.children}
      </View>
    );
  }
}
