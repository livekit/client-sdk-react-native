import livekit_react_native_webrtc
import React

@objc
public class MultibandVolumeAudioRenderer: BaseMultibandVolumeAudioRenderer {
    private let eventEmitter: RCTEventEmitter
    
    @objc
    public var reactTag: String? = nil

    @objc
    public init(
        bands: Int,
        minFrequency: Float,
        maxFrequency: Float,
        intervalMs: Float,
        eventEmitter: RCTEventEmitter
    ) {
        self.eventEmitter = eventEmitter
        super.init(bands: bands,
                   minFrequency: minFrequency,
                   maxFrequency: maxFrequency,
                   intervalMs: intervalMs)
    }
    
    override func onMagnitudesCalculated(_ magnitudes: [Float]) {
        guard !magnitudes.isEmpty, let reactTag = self.reactTag
        else { return }
        eventEmitter.sendEvent(withName: LKEvents.kEventMultibandProcessed, body: [
            "magnitudes": magnitudes,
            "id": reactTag
        ])
    }
    
}

public class BaseMultibandVolumeAudioRenderer: NSObject, RTCAudioRenderer {
    private let frameInterval: Int
    private var skippedFrames = 0
    private let audioProcessor: AudioVisualizeProcessor
    
    init(
        bands: Int,
        minFrequency: Float,
        maxFrequency: Float,
        intervalMs: Float
    ) {
        self.frameInterval = Int((intervalMs / 10.0).rounded())
        self.audioProcessor = AudioVisualizeProcessor(minFrequency: minFrequency, maxFrequency: maxFrequency, bandsCount: bands)
    }
    
    public func render(pcmBuffer: AVAudioPCMBuffer) {
        if(skippedFrames < frameInterval - 1) {
            skippedFrames += 1
            return
        }
        
        skippedFrames = 0
        guard let magnitudes = audioProcessor.process(pcmBuffer: pcmBuffer)
        else {
            return
        }
        onMagnitudesCalculated(magnitudes)
    }
    
    func onMagnitudesCalculated(_ magnitudes: [Float]) { }
}
