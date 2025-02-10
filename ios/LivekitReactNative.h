//
//  LivekitReactNative.h
//  LivekitReactNative
//
//  Created by David Liu on 9/4/22.
//  Copyright © 2022-2025 LiveKit. All rights reserved.
//
#import <React/RCTBridgeModule.h>
#import <WebRTC/WebRTC.h>
#import <React/RCTEventEmitter.h>

@class AudioRendererManager;
@interface LivekitReactNative : RCTEventEmitter <RCTBridgeModule>
@property(nonatomic, strong) AudioRendererManager* _Nonnull audioRendererManager;
+(void)setup;
@end

extern NSString * _Nonnull const kEventVolumeProcessed;
extern NSString * _Nonnull const kEventMultibandProcessed;
