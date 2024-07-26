/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import "LKAudioProcessingDelegate.h"

@interface AppDelegate : RCTAppDelegate

@property(nonatomic, strong, nullable) id<RTCAudioCustomProcessingDelegate> postDelegate;
@property(nonatomic, strong, nullable) id<RTCAudioCustomProcessingDelegate> preDelegate;

@end
