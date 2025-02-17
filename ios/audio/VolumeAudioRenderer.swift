import livekit_react_native_webrtc
import React

@objc
public class VolumeAudioRenderer: BaseVolumeAudioRenderer {
    private let eventEmitter: RCTEventEmitter
    
    @objc
    public var reactTag: String? = nil
    
    @objc
    public init(intervalMs: Double, eventEmitter: RCTEventEmitter) {
        self.eventEmitter = eventEmitter
        super.init(intervalMs: intervalMs)
    }
    
    override public func onVolumeCalculated(_ audioLevels: [AudioLevel]) {
        guard let rmsAvg = audioLevels.combine()?.average,
            let reactTag = self.reactTag
        else { return }
        eventEmitter.sendEvent(withName: LKEvents.kEventVolumeProcessed, body: [
            "volume": rmsAvg,
            "id": reactTag
        ])
    }
}

public class BaseVolumeAudioRenderer: NSObject, RTCAudioRenderer {
    private let frameInterval: Int
    private var skippedFrames = 0
    public init(intervalMs: Double = 30) {
        self.frameInterval = Int((intervalMs / 10.0).rounded())
    }
    
    public func render(pcmBuffer: AVAudioPCMBuffer) {
        if(skippedFrames < frameInterval - 1) {
            skippedFrames += 1
            return
        }
        
        skippedFrames = 0
        guard let pcmBuffer = pcmBuffer.convert(toCommonFormat: .pcmFormatFloat32) else { return }
        let audioLevels = pcmBuffer.audioLevels()
        onVolumeCalculated(audioLevels)
    }
    
    public func onVolumeCalculated(_ audioLevels: [AudioLevel]) {
        
    }
}
