'use strict';

import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';

export type Props = {
  disabled?: boolean;
  style?: ViewStyle;
  onChange?: (isVisible: boolean) => void;
  delay?: number;
};

/**
 * Detects when this is in the viewport and visible.
 *
 * Will not fire visibility changes for zero width/height components.
 */
export default class ViewPortDetector extends Component<Props> {
  private lastValue: boolean | null = null;
  private interval: any | null = null;
  private view: View | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { rectTop: 0, rectBottom: 0 };
  }

  componentDidMount() {
    if (!this.props.disabled) {
      this.startWatching();
    }
  }

  componentWillUnmount() {
    this.stopWatching();
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (nextProps.disabled) {
      this.stopWatching();
    } else {
      this.lastValue = null;
      this.startWatching();
    }
  }

  private startWatching() {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(() => {
      if (!this.view) {
        return;
      }
      this.view.measure((_x, _y, width, height, _pageX, _pageY) => {
        this.checkInViewPort(width, height);
      });
    }, this.props.delay || 100);
  }

  private stopWatching() {
    this.interval = clearInterval(this.interval);
  }

  private checkInViewPort(width?: number, height?: number) {
    let isVisible: boolean;
    // Not visible if any of these are missing.
    if (!width || !height) {
      isVisible = false;
    } else {
      isVisible = true;
    }

    if (this.lastValue !== isVisible) {
      this.lastValue = isVisible;
      this.props.onChange?.(isVisible);
    }
  }

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
