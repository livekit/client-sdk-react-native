//
//  LKLocalMicIndicator.m
//  LivekitReactNativeExample
//
//  Created by David Liu on 7/26/24.
//

#import <Foundation/Foundation.h>
#import <WebRTC/WebRTC.h>
#import "LKLocalMicIndicatorManager.h"
#import "AppDelegate.h"
#include "math.h"


@interface LKLocalMicIndicator : UIView <RTCAudioCustomProcessingDelegate>
@end

@implementation LKLocalMicIndicator

- (void)audioProcessingInitializeWithSampleRate:(size_t)sampleRateHz channels:(size_t)channels { 
  
}

- (void)audioProcessingProcess:(nonnull RTCAudioBuffer *)audioBuffer {
  // Process every 10 buffers.
  static int bufferNum = 10;
  
  bufferNum++;
  if(bufferNum < 10) {
    return;
  }
  bufferNum = 0;
  
  // Calculate RMS to get approximate volume.
  float average = 0;
  float frames = [audioBuffer frames];
  float* channel = [audioBuffer rawBufferForChannel:0];
  
  for (int i = 0; i < frames; i++) {
    average += channel[i] * channel[i];
  }
  
  average /= frames;
  float volume = sqrt(average);
  NSLog(@"volume: %f", volume);
  
  dispatch_async(dispatch_get_main_queue(), ^{
    if(volume > 1000) {
      [self setBackgroundColor:[UIColor greenColor]];
    } else {
      [self setBackgroundColor:[UIColor redColor]];
    }
  });
}

- (void)audioProcessingRelease { 
  
}

@end

@implementation LKLocalMicIndicatorManager

RCT_EXPORT_MODULE(LKLocalMicIndicator)
- (UIView *)view
{
  LKLocalMicIndicator * view = [[LKLocalMicIndicator alloc] init];

  AppDelegate* appDelegate = (AppDelegate* )[[UIApplication sharedApplication] delegate];
  ((LKAudioProcessingDelegate*) appDelegate.postDelegate).target = view;
  return view;
}

@end
