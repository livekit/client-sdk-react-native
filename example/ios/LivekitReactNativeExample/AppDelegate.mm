#import "AppDelegate.h"
#import "LivekitReactNative.h"
#import "LKAudioProcessingDelegate.h"
#import "WebRTCModuleOptions.h"
#import <React/RCTBundleURLProvider.h>
#import <WebRTC/WebRTC.h>


@interface AppDelegate ()


@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [LivekitReactNative setup];
  
  WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
  _postDelegate = [[LKAudioProcessingDelegate alloc] init];
  RTCDefaultAudioProcessingModule * processingModule = [[RTCDefaultAudioProcessingModule alloc] initWithConfig:nil
                                                                                 capturePostProcessingDelegate:_postDelegate
                                                                                   renderPreProcessingDelegate:nil];
  
  options.audioProcessingModule = processingModule;
  self.moduleName = @"LivekitReactNativeExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}
 
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
