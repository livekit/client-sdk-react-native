#import <Foundation/Foundation.h>
#import <LiveKitWebRTC/LiveKitWebRTC.h>

@protocol LKExternalAudioProcessingDelegate

- (void)audioProcessingInitializeWithSampleRate:(size_t)sampleRateHz channels:(size_t)channels;

- (void)audioProcessingProcess:(LKRTCAudioBuffer * _Nonnull)audioBuffer;

- (void)audioProcessingRelease;

@end

@interface LKAudioProcessingAdapter : NSObject <LKRTCAudioCustomProcessingDelegate>

- (nonnull instancetype)init;

- (void)addProcessing:(id<LKExternalAudioProcessingDelegate> _Nonnull)processor;

- (void)removeProcessing:(id<LKExternalAudioProcessingDelegate> _Nonnull)processor;

- (void)addAudioRenderer:(nonnull id<LKRTCAudioRenderer>)renderer;

- (void)removeAudioRenderer:(nonnull id<LKRTCAudioRenderer>)renderer;

@end