import livekit_react_native_webrtc
import React

@objc
public class AudioSinkRenderer: BaseAudioSinkRenderer {
    private let eventEmitter: RCTEventEmitter
    private var hasSentFirstPreconnectDebug = false
    
    @objc
    public var reactTag: String? = nil
    
    @objc
    public init(eventEmitter: RCTEventEmitter) {
        self.eventEmitter = eventEmitter
        super.init()
    }
    
    override public func onData(_ pcmBuffer: AVAudioPCMBuffer) {
        guard pcmBuffer.format.commonFormat == .pcmFormatInt16,
              let channelData = pcmBuffer.int16ChannelData else {
            return
        }
        let channelCount = Int(pcmBuffer.format.channelCount)
        let channels = UnsafeBufferPointer(start: channelData, count: channelCount)
        let length = Int(pcmBuffer.frameCapacity * pcmBuffer.format.streamDescription.pointee.mBytesPerFrame)
        let data = NSData(bytes: channels[0], length: length)
        let base64 = data.base64EncodedString()
        if !hasSentFirstPreconnectDebug {
            hasSentFirstPreconnectDebug = true
            eventEmitter.sendEvent(withName: LKEvents.kEventPreconnectDebug, body: [
                "base64Length": base64.count,
                "byteLength": data.length,
                "channels": channelCount,
                "frameLength": pcmBuffer.frameLength,
                "id": reactTag,
                "sampleRate": pcmBuffer.format.sampleRate,
                "stage": "first_native_pcm_chunk",
                "timestampMs": Int(Date().timeIntervalSince1970 * 1000)
            ])
        }
        eventEmitter.sendEvent(withName: LKEvents.kEventAudioData, body: [
            "data": base64,
            "id": reactTag
        ])
    }
}

public class BaseAudioSinkRenderer: NSObject, RTCAudioRenderer {
    
    public override init() {
        super.init()
    }
    
    public func render(pcmBuffer: AVAudioPCMBuffer) {
        onData(pcmBuffer)
    }
    
    public func onData(_ pcmBuffer: AVAudioPCMBuffer) {
    }
}
