#if TARGET_OS_IPHONE
#import <AVFoundation/AVFoundation.h>

@interface AudioUtils : NSObject
+ (AVAudioSessionMode)audioSessionModeFromString:(NSString*)mode;
+ (AVAudioSessionCategory)audioSessionCategoryFromString:(NSString *)category;
@end

#endif
