#import <Foundation/Foundation.h>
#import <WebRTC/WebRTC.h>

@protocol LKExternalAudioProcessingDelegate

- (void)audioProcessingInitializeWithSampleRate:(size_t)sampleRateHz channels:(size_t)channels;

- (void)audioProcessingProcess:(RTC_OBJC_TYPE(RTCAudioBuffer) * _Nonnull)audioBuffer;

- (void)audioProcessingRelease;

@end

@interface LKAudioProcessingAdapter : NSObject <RTCAudioCustomProcessingDelegate>

- (nonnull instancetype)init;

- (void)addProcessing:(id<LKExternalAudioProcessingDelegate> _Nonnull)processor;

- (void)removeProcessing:(id<LKExternalAudioProcessingDelegate> _Nonnull)processor;

- (void)addAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer;

- (void)removeAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer;

@end