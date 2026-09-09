#import <Foundation/Foundation.h>
#import <LiveKitWebRTC/LiveKitWebRTC.h>
#import "LKAudioProcessingAdapter.h"

@interface LKAudioProcessingManager : NSObject

@property(nonatomic, strong) LKRTCDefaultAudioProcessingModule* _Nonnull audioProcessingModule;

@property(nonatomic, strong) LKAudioProcessingAdapter* _Nonnull capturePostProcessingAdapter;

@property(nonatomic, strong) LKAudioProcessingAdapter* _Nonnull renderPreProcessingAdapter;

+ (_Nonnull instancetype)sharedInstance;


- (void)addLocalAudioRenderer:(nonnull id<LKRTCAudioRenderer>)renderer;

- (void)removeLocalAudioRenderer:(nonnull id<LKRTCAudioRenderer>)renderer;

- (void)addRemoteAudioRenderer:(nonnull id<LKRTCAudioRenderer>)renderer;

- (void)removeRemoteAudioRenderer:(nonnull id<LKRTCAudioRenderer>)renderer;

- (void)addCapturePostProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor;

- (void)removeCapturePostProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor;

- (void)addRenderPreProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)renderer;

- (void)removeRenderPreProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)renderer;

- (void)clearProcessors;

@end
