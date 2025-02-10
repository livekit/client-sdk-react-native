#import "LKAudioProcessingManager.h"
#import "LKAudioProcessingAdapter.h"

@implementation LKAudioProcessingManager

+ (instancetype)sharedInstance {
    static dispatch_once_t onceToken;
    static LKAudioProcessingManager* sharedInstance = nil;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init {
    if (self = [super init]) {
        _audioProcessingModule = [[RTCDefaultAudioProcessingModule alloc] init];
        _capturePostProcessingAdapter = [[LKAudioProcessingAdapter alloc] init];
        _renderPreProcessingAdapter = [[LKAudioProcessingAdapter alloc] init];
        _audioProcessingModule.capturePostProcessingDelegate = _capturePostProcessingAdapter;
        _audioProcessingModule.renderPreProcessingDelegate = _renderPreProcessingAdapter;
    }
    return self;
}

- (void)addLocalAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer {
  [_capturePostProcessingAdapter addAudioRenderer:renderer];
}

- (void)removeLocalAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer {
  [_capturePostProcessingAdapter removeAudioRenderer:renderer];
}

- (void)addRemoteAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer {
  [_renderPreProcessingAdapter addAudioRenderer:renderer];
}

- (void)removeRemoteAudioRenderer:(nonnull id<RTCAudioRenderer>)renderer {
  [_renderPreProcessingAdapter removeAudioRenderer:renderer];
}

- (void)addCapturePostProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor {
    [_capturePostProcessingAdapter addProcessing:processor];
}

- (void)removeCapturePostProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor {
    [_capturePostProcessingAdapter removeProcessing:processor];
}

- (void)addRenderPreProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor {
    [_renderPreProcessingAdapter addProcessing:processor];
}

- (void)removeRenderPreProcessor:(nonnull id<LKExternalAudioProcessingDelegate>)processor {
    [_renderPreProcessingAdapter removeProcessing:processor];
}

- (void)clearProcessors {
    // TODO
}


@end
