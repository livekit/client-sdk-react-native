#import "LKRNWebRTCModule.h"
#import "LKRNWebRTCModuleOptions.h"
#import "LivekitReactNative.h"
#import "LKAudioProcessingManager.h"

@implementation LivekitReactNative

+(void)setup {
    LKRTCDefaultVideoEncoderFactory *videoEncoderFactory = [[LKRTCDefaultVideoEncoderFactory alloc] init];
    LKRTCVideoEncoderFactorySimulcast *simulcastVideoEncoderFactory = [[LKRTCVideoEncoderFactorySimulcast alloc] initWithPrimary:videoEncoderFactory fallback:videoEncoderFactory];
    LKRNWebRTCModuleOptions *options = [LKRNWebRTCModuleOptions sharedInstance];
    options.videoEncoderFactory = simulcastVideoEncoderFactory;
    options.audioProcessingModule = LKAudioProcessingManager.sharedInstance.audioProcessingModule;

    // LKRNWebRTCModule only applies its own default field trials when fieldTrials is
    // nil, so carry the dual-sim fix over ourselves.
    // https://bugs.chromium.org/p/webrtc/issues/detail?id=10966
    options.fieldTrials = @{
        kLKRTCFieldTrialUseNWPathMonitor : kLKRTCFieldTrialEnabledValue,
        // WARP: fold the DTLS handshake into the ICE handshake.
        kLKRTCFieldTrialIceHandshakeDtlsKey : kLKRTCFieldTrialEnabledValue,
    };
}

@end
