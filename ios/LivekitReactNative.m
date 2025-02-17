#import "WebRTCModule.h"
#import "WebRTCModuleOptions.h"
#import "LivekitReactNative.h"
#import "LKAudioProcessingManager.h"

@implementation LivekitReactNative

+(void)setup {
    RTCDefaultVideoEncoderFactory *videoEncoderFactory = [[RTCDefaultVideoEncoderFactory alloc] init];
    RTCVideoEncoderFactorySimulcast *simulcastVideoEncoderFactory = [[RTCVideoEncoderFactorySimulcast alloc] initWithPrimary:videoEncoderFactory fallback:videoEncoderFactory];
    WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    options.videoEncoderFactory = simulcastVideoEncoderFactory;
    options.audioProcessingModule = LKAudioProcessingManager.sharedInstance.audioProcessingModule;
}

@end
