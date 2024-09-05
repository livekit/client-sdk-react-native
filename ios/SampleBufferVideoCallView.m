#import "SampleBufferVideoCallView.h"
#import <WebRTC/WebRTC.h>


@implementation RTCI420Buffer (CVPixelBuffer)

-(CVPixelBufferRef)toCVPixelBuffer {
    CVPixelBufferRef pixelBuffer = NULL;
            
    NSDictionary *pixelBufferAttributes = [NSDictionary dictionaryWithObjectsAndKeys:
                                           [NSDictionary dictionary],
                                           (id)kCVPixelBufferIOSurfacePropertiesKey,
                                           nil
    ];

    CVReturn result = CVPixelBufferCreate(kCFAllocatorDefault,
                                          self.width,
                                          self.height,
                                          kCVPixelFormatType_32BGRA,
                                          (__bridge CFDictionaryRef)pixelBufferAttributes,
                                          &pixelBuffer);
            
    if (result != kCVReturnSuccess) {
        return NULL;
    }

    result = CVPixelBufferLockBaseAddress(pixelBuffer, 0);
    
    if (result != kCVReturnSuccess) {
        NSLog(@"convertToCVPixelBufferWithI420Buffer result = %d",result);
        CFRelease(pixelBuffer);
        return NULL;
    }

    uint8_t *dst = CVPixelBufferGetBaseAddress(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    
    int ret = [RTCYUVHelper I420ToARGB:self.dataY
                            srcStrideY:self.strideY
                                  srcU:self.dataU
                            srcStrideU:self.strideU
                                  srcV:self.dataV
                            srcStrideV:self.strideV
                               dstARGB:dst
                         dstStrideARGB:bytesPerRow
                                 width:self.width
                                height:self.height];
        
    CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
    if (ret) {
        NSLog(@"I420ToARGB ret = %d",ret);
        CFRelease(pixelBuffer);
        return NULL;
    }

    return pixelBuffer;
}

@end

@implementation RTCVideoFrame (Helpers)

-(CVPixelBufferRef)toCVPixelBuffer {
    if ([self.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
        return [((RTCCVPixelBuffer *) self.buffer) pixelBuffer];
    } else {
        return [((RTCI420Buffer *)[self.buffer toI420]) toCVPixelBuffer];
    }
}

@end


@implementation SampleBufferVideoCallView

+ (Class)layerClass {
    return [AVSampleBufferDisplayLayer class];
}

- (instancetype)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(layerFailedToDecode:) name:AVSampleBufferDisplayLayerFailedToDecodeNotification object:self.sampleBufferLayer];
    }
    return self;
}

- (void)layerFailedToDecode:(NSNotification*)note
{
    NSLog(@"layerFailedToDecode");
    AVSampleBufferDisplayLayer *videolayer = (AVSampleBufferDisplayLayer*)[self layer];
    NSError *error = [[note userInfo] valueForKey:AVSampleBufferDisplayLayerFailedToDecodeNotificationErrorKey];
    NSLog(@"Error: %@", error);
}

- (AVSampleBufferDisplayLayer *)sampleBufferLayer {
    return (AVSampleBufferDisplayLayer *)self.layer;
}

/** The size of the frame. */
- (void)setSize : (CGSize)size{
    
}

/** The frame to be displayed. */
- (void)renderFrame:(nullable RTC_OBJC_TYPE(RTCVideoFrame) *)frame {
    
    // Handle incoming video frames
    NSLog(@"frame!");
    
    // Convert RTCVideoFrame to CMSampleBuffer
    CMSampleBufferRef sampleBuffer = [self sampleBufferFrom:frame];

    // TODO: handle overflows
    dispatch_async(dispatch_get_main_queue(), ^{
        // Display the CMSampleBuffer using AVSampleBufferDisplayLayer
        [self.sampleBufferLayer enqueueSampleBuffer:sampleBuffer];
        CFRelease(sampleBuffer);
    });
}

- (CMSampleBufferRef)sampleBufferFrom:(RTCVideoFrame *)rtcVideoFrame {
    // Convert RTCVideoFrame to CMSampleBuffer
    
    // Assuming your RTCVideoFrame contains pixelBuffer
    CVPixelBufferRef pixelBuffer = [rtcVideoFrame toCVPixelBuffer];
    if (!pixelBuffer) {
        return nil;
    }
    
    // Create a CMVideoFormatDescription
    CMVideoFormatDescriptionRef formatDescription;
    CMVideoFormatDescriptionCreateForImageBuffer(kCFAllocatorDefault, pixelBuffer, &formatDescription);
    
    // Create CMSampleTimingInfo
    CMSampleTimingInfo timingInfo;
    timingInfo.presentationTimeStamp = CMTimeMake(rtcVideoFrame.timeStamp, 90000);
    timingInfo.decodeTimeStamp = CMTimeMake(rtcVideoFrame.timeStamp, 90000);
    
    // Create CMSampleBuffer
    CMSampleBufferRef sampleBuffer;
    CMSampleBufferCreateForImageBuffer(kCFAllocatorDefault, pixelBuffer, true, nil, nil, formatDescription, &timingInfo, &sampleBuffer);
    
    CFArrayRef attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, YES);
    CFMutableDictionaryRef dict = (CFMutableDictionaryRef)CFArrayGetValueAtIndex(attachments, 0);

    CFDictionarySetValue(dict, kCMSampleAttachmentKey_DisplayImmediately, kCFBooleanTrue);
    
    return sampleBuffer;
}
@end

