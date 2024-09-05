#import <AVFoundation/AVFoundation.h>
#import <objc/runtime.h>

#import <React/RCTLog.h>
#import <React/RCTView.h>

#import <WebRTC/RTCMediaStream.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCVideoFrame.h>
#import <WebRTC/RTCVideoTrack.h>

#import "SampleBufferVideoCallView.h"
#import "RTCPIPVideoViewManager.h"
#import "PIPController.h"
#import "WebRTCModule.h"

API_AVAILABLE(ios(15.0))
@interface RTCPIPVideoView : RCTView

/**
 * Reference to the main WebRTC RN module.
 */
@property(nonatomic, weak) WebRTCModule *module;

@property(nonatomic, strong) PIPController *pipController;


@end

@implementation RTCPIPVideoView

@synthesize pipController = _pipController;

/**
 * Initializes and returns a newly allocated view object with the specified
 * frame rectangle.
 *
 * @param frame The frame rectangle for the view, measured in points.
 */
- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        _pipController = [[PIPController alloc] initWithSourceView:self];
    }

    return self;
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
    [_pipController togglePIP];
}
/**
 * Implements the setter of the {@link #videoTrack} property of this
 * {@code RTCVideoView}.
 *
 * @param videoTrack The value to set on the {@code videoTrack} property of this
 * {@code RTCVideoView}.
 */
- (void)setVideoTrack:(RTCVideoTrack *)videoTrack {
    _pipController.videoTrack = videoTrack;
}

@end

@implementation RTCPIPVideoViewManager

RCT_EXPORT_MODULE()

- (RCTView *)view {
    NSLog(@"RTCPIPVIDEO VIEW CREATE");
    RTCPIPVideoView *v = [[RTCPIPVideoView alloc] init];
    v.module = [self.bridge moduleForName:@"WebRTCModule"];
    v.clipsToBounds = YES;
    return v;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

#pragma mark - View properties


RCT_CUSTOM_VIEW_PROPERTY(streamURL, NSString *, RTCPIPVideoView) {
    if (!json) {
        view.videoTrack = nil;
        return;
    }

    NSString *streamReactTag = json;
    WebRTCModule *module = view.module;

    dispatch_async(module.workerQueue, ^{
        RTCMediaStream *stream = [module streamForReactTag:streamReactTag];
        NSArray *videoTracks = stream ? stream.videoTracks : @[];
        RTCVideoTrack *videoTrack = [videoTracks firstObject];
        if (!videoTrack) {
            RCTLogWarn(@"No video stream for react tag: %@", streamReactTag);
        } else {
            dispatch_async(dispatch_get_main_queue(), ^{
                NSLog(@"RTCPIPVIDEO VIEW TRACK SET %@", json);
                view.videoTrack = videoTrack;
            });
        }
    });
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

@end
