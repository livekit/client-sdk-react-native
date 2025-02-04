#import <Foundation/Foundation.h>
#import <WebRTC/WebRTC.h>
#import "LKAudioProcessingAdapter.h"

@interface LKAudioProcessingManager : NSObject

@property(nonatomic, strong) RTCDefaultAudioProcessingModule* _Nonnull audioProcessingModule;

@property(nonatomic, strong) LKAudioProcessingAdapter* _Nonnull capturePostProcessingAdapter;

@property(nonatomic, strong) LKAudioProcessingAdapter* _Nonnull renderPreProcessingAdapter;

+ (_Nonnull instancetype)sharedInstance;


- (void)addLocalAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer;

- (void)removeLocalAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer;

- (void)addRemoteAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer;

- (void)removeRemoteAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer;

- (void)addCapturePostProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor;

- (void)removeCapturePostProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor;

- (void)addRenderPreProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)renderer;

- (void)removeRenderPreProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)renderer;

- (void)clearProcessors;

@end
