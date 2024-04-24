#if TARGET_OS_IPHONE
#import "AudioUtils.h"
#import <AVFoundation/AVFoundation.h>

@implementation AudioUtils

+ (AVAudioSessionMode)audioSessionModeFromString:(NSString*)mode {
  if([@"default_" isEqualToString:mode]) {
    return AVAudioSessionModeDefault;
  } else if([@"voicePrompt" isEqualToString:mode]) {
    return AVAudioSessionModeVoicePrompt;
  } else if([@"videoRecording" isEqualToString:mode]) {
    return AVAudioSessionModeVideoRecording;
  } else if([@"videoChat" isEqualToString:mode]) {
    return AVAudioSessionModeVideoChat;
  } else if([@"voiceChat" isEqualToString:mode]) {
    return AVAudioSessionModeVoiceChat;
  } else if([@"gameChat" isEqualToString:mode]) {
    return AVAudioSessionModeGameChat;
  } else if([@"measurement" isEqualToString:mode]) {
    return AVAudioSessionModeMeasurement;
  } else if([@"moviePlayback" isEqualToString:mode]) {
    return AVAudioSessionModeMoviePlayback;
  } else if([@"spokenAudio" isEqualToString:mode]) {
    return AVAudioSessionModeSpokenAudio;
  } 
  return AVAudioSessionModeDefault;
}

+ (AVAudioSessionCategory)audioSessionCategoryFromString:(NSString *)category {
  if([@"ambient" isEqualToString:category]) {
    return AVAudioSessionCategoryAmbient;
  } else if([@"soloAmbient" isEqualToString:category]) {
    return AVAudioSessionCategorySoloAmbient;
  } else if([@"playback" isEqualToString:category]) {
    return AVAudioSessionCategoryPlayback;
  } else if([@"record" isEqualToString:category]) {
    return AVAudioSessionCategoryRecord;
  } else if([@"playAndRecord" isEqualToString:category]) {
    return AVAudioSessionCategoryPlayAndRecord;
  } else if([@"multiRoute" isEqualToString:category]) {
    return AVAudioSessionCategoryMultiRoute;
  }
  return AVAudioSessionCategoryAmbient;
}

@end
#endif
