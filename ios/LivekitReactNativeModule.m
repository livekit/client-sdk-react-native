#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "WebRTCModule.h"

@interface RCT_EXTERN_MODULE(LivekitReactNativeModule, RCTEventEmitter)

RCT_EXTERN_METHOD(configureAudio:(NSDictionary *) config)
RCT_EXTERN_METHOD(startAudioSession)
RCT_EXTERN_METHOD(stopAudioSession)

RCT_EXTERN_METHOD(showAudioRoutePicker)
RCT_EXTERN_METHOD(getAudioOutputsWithResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(selectAudioOutput:(NSString *)deviceId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


/// Configure audio config for WebRTC
RCT_EXTERN_METHOD(setAppleAudioConfiguration:(NSDictionary *) configuration)


RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(createVolumeProcessor:(nonnull NSNumber *)pcId
                                        trackId:(nonnull NSString *)trackId)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(deleteVolumeProcessor:(nonnull NSString *)reactTag
                                        pcId:(nonnull NSNumber *)pcId
                                        trackId:(nonnull NSString *)trackId)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(createMultibandVolumeProcessor:(NSDictionary *)options
                                        pcId:(nonnull NSNumber *)pcId
                                        trackId:(nonnull NSString *)trackId)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(deleteMultibandVolumeProcessor:(nonnull NSString *)reactTag
                                        pcId:(nonnull NSNumber *)pcId
                                        trackId:(nonnull NSString *)trackId)

+(BOOL)requiresMainQueueSetup {
  return NO;
}

@end
