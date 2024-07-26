//
//  LKAudioProcessingModule.h
//  LivekitReactNativeExample
//
//  Created by David Liu on 7/25/24.
//

#ifndef LKAudioProcessingModule_h
#define LKAudioProcessingModule_h
#import <WebRTC/RTCAudioCustomProcessingDelegate.h>

@interface LKAudioProcessingDelegate : NSObject <RTCAudioCustomProcessingDelegate>

@property(nonatomic, weak, nullable) id<RTCAudioCustomProcessingDelegate> target;

@end


#endif /* LKAudioProcessingModule_h */
