#import <React/RCTBridgeModule.h>
#import "LivekitReactNative.h"
#import <WebRTC/RTCAudioSession.h>
#import <WebRTC/RTCAudioSessionConfiguration.h>
#import <AVFAudio/AVFAudio.h>
#import <AVKit/AVKit.h>

@implementation LivekitReactNative
RCT_EXPORT_MODULE();

-(instancetype)init {
    if(self = [super init]) {
        [self configureAudio];
        return self;
    } else {
        return nil;
    }
}

+(BOOL)requiresMainQueueSetup {
    return NO;
}

/// Configure default audio config for WebRTC
RCT_EXPORT_METHOD(configureAudio){
    RTCAudioSessionConfiguration* config = [[RTCAudioSessionConfiguration alloc] init];
    [config setCategory:AVAudioSessionCategoryPlayAndRecord];
    [config setCategoryOptions:
         AVAudioSessionCategoryOptionAllowAirPlay|
         AVAudioSessionCategoryOptionAllowBluetooth|
         AVAudioSessionCategoryOptionAllowBluetoothA2DP|
         AVAudioSessionCategoryOptionDefaultToSpeaker
    ];
    [config setMode:AVAudioSessionModeVideoChat];
    [RTCAudioSessionConfiguration setWebRTCConfiguration: config];
    NSLog(@"configureAudio finish");
}

RCT_EXPORT_METHOD(startAudioSession){
}

RCT_EXPORT_METHOD(verifyAudioSession){
    NSLog(@"verifyAudioSession");
    AVAudioSession* session = [AVAudioSession sharedInstance];
    NSLog(@"category: %@", [session category]);
    NSLog(@"options: %lu", (unsigned long)[session categoryOptions]);
    NSLog(@"mode: %@", [session mode]);
    NSLog(@"verifyAudioSession finish");
    
    [session setCategory:AVAudioSessionCategoryPlayAndRecord
             withOptions:AVAudioSessionCategoryOptionAllowAirPlay|AVAudioSessionCategoryOptionAllowBluetooth|AVAudioSessionCategoryOptionAllowBluetoothA2DP
                   error:nil];
}

RCT_EXPORT_METHOD(stopAudioSession){
    
}

RCT_EXPORT_METHOD(showAudioRoutePicker){
    if (@available(iOS 11.0, *)) {
        AVRoutePickerView *routePickerView = [[AVRoutePickerView alloc] init];
        NSArray<UIView *> *subviews = routePickerView.subviews;
        for (int i = 0; i < subviews.count; i++) {
            UIView *subview = [subviews objectAtIndex:i];
            if([subview isKindOfClass:[UIButton class]]) {
                UIButton *button = (UIButton *) subview;
                [button sendActionsForControlEvents:UIControlEventTouchUpInside];
                break;
            }
        }
    }
}

RCT_EXPORT_METHOD(getAudioOutputsWithResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject){
    resolve(@[@"default", @"force_speaker"]);
}
RCT_EXPORT_METHOD(selectAudioOutput:(NSString *)deviceId
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject){
    
    AVAudioSession *session = [AVAudioSession sharedInstance];
    NSError *error = nil;
    
    if ([deviceId isEqualToString:@"default"]) {
        [session overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:&error];
    } else if ([deviceId isEqualToString:@"force_speaker"]) {
        [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:&error];
    }
    
    if (error != nil) {
        reject(@"selectAudioOutput error", error.localizedDescription, error);
    } else {
        resolve(nil);
    }
}
@end
