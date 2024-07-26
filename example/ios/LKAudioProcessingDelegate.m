//
//  LKAudioProcessingDelegate.m
//  LivekitReactNativeExample
//
//  Created by David Liu on 7/25/24.
//

#import <Foundation/Foundation.h>
#import <WebRTC/RTCAudioBuffer.h>
#import "LKAudioProcessingDelegate.h"

@implementation LKAudioProcessingDelegate

/**
* (Re-)initialize the audio processor.
* This method can be invoked multiple times.
*/
- (void)audioProcessingInitializeWithSampleRate : (size_t)sampleRateHz channels
: (size_t)channels NS_SWIFT_NAME(audioProcessingInitialize(sampleRate:channels:)){
  NSLog(@"audioProcessingInitialize");
}
/**
 * Process (read or write) the audio buffer.
 * RTCAudioBuffer is a simple wrapper for webrtc::AudioBuffer and the valid scope is only inside
 * this method. Do not retain it.
 */
- (void)audioProcessingProcess:(RTC_OBJC_TYPE(RTCAudioBuffer) *)audioBuffer
    NS_SWIFT_NAME(audioProcessingProcess(audioBuffer:)){
  [self.target audioProcessingProcess:audioBuffer];
}

/**
 * Suggests releasing resources allocated by the audio processor.
 */
- (void)audioProcessingRelease {
  NSLog(@"audioProcessingRelease");
}

@end
