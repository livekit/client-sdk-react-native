#import <UIKit/UIKit.h>
#import <WebRTC/RTCVideoTrack.h>

API_AVAILABLE(ios(15.0))
@interface PIPController : NSObject <AVPictureInPictureControllerDelegate>

@property(nonatomic, weak) UIView *sourceView;
/**
 * The {@link RTCVideoTrack}, if any, which this instance renders.
 */
@property(nonatomic, strong) RTCVideoTrack *videoTrack;

- (instancetype)initWithSourceView:(UIView *)sourceView;
- (void)togglePIP;
@end
