import livekit_react_native_webrtc

@objc
public class AudioRendererManager: NSObject {
    private let bridge: RCTBridge
    public private(set) var renderers: [String: LKRTCAudioRenderer] = [:]
    
    init(bridge: RCTBridge) {
        self.bridge = bridge
    }
    
    @objc
    public func registerRenderer(_ audioRenderer: LKRTCAudioRenderer) -> String {
        let reactTag = NSUUID().uuidString
        self.renderers[reactTag] = audioRenderer
        return reactTag
    }
    
    @objc
    public func unregisterRenderer(forReactTag: String) {
        self.renderers.removeValue(forKey: forReactTag)
    }
    
    @objc
    public func unregisterRenderer(_ audioRenderer: LKRTCAudioRenderer) {
        self.renderers = self.renderers.filter({ $0.value !== audioRenderer })
    }
    
    @objc
    public func attach(renderer: LKRTCAudioRenderer, pcId: NSNumber, trackId: String) {
        let webrtcModule = self.bridge.module(for: WebRTCModule.self) as! WebRTCModule
        guard let track = webrtcModule.track(forId: trackId, pcId: pcId) as? LKRTCAudioTrack
        else {
            lklog("couldn't find audio track: pcId: \(pcId), trackId: \(trackId)")
            return
        }
        
        if (pcId == -1) {
            LKAudioProcessingManager.sharedInstance().addLocalAudioRenderer(renderer);
        } else {
            track.add(renderer)
        }
    }
    
    @objc
    public func detach(rendererByTag reactTag:String, pcId: NSNumber, trackId: String){
        guard let renderer = self.renderers[reactTag]
        else {
            lklog("couldn't find renderer: tag: \(reactTag)")
            return
        }
        
        detach(renderer: renderer, pcId: pcId, trackId: trackId)
    }
    
    @objc
    public func detach(renderer: LKRTCAudioRenderer, pcId: NSNumber, trackId: String) {
        let webrtcModule = self.bridge.module(for: WebRTCModule.self) as! WebRTCModule
        guard let track = webrtcModule.track(forId: trackId, pcId: pcId) as? LKRTCAudioTrack
        else {
            lklog("couldn't find audio track: pcId: \(pcId), trackId: \(trackId)")
            return
        }
        
        if (pcId == -1) {
            LKAudioProcessingManager.sharedInstance().removeLocalAudioRenderer(renderer);
        } else {
            track.remove(renderer)
        }
    }
}
