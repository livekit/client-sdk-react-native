import livekit_react_native_webrtc
import AVFoundation
import AVFAudio
import React

struct LKEvents {
    static let kEventVolumeProcessed = "LK_VOLUME_PROCESSED";
    static let kEventMultibandProcessed = "LK_MULTIBAND_PROCESSED";
}

@objc(LivekitReactNativeModule)
public class LivekitReactNativeModule: RCTEventEmitter {
    
    // This cannot be initialized in init as self.bridge is given afterwards.
    private var _audioRendererManager: AudioRendererManager? = nil
    public var audioRendererManager: AudioRendererManager {
        get {
            if _audioRendererManager == nil {
                _audioRendererManager = AudioRendererManager(bridge: self.bridge)
            }
            
            return _audioRendererManager!
        }
    }
    
    @objc
    public override init() {
        super.init()
        let config = RTCAudioSessionConfiguration()
        config.category = AVAudioSession.Category.playAndRecord.rawValue
        config.categoryOptions = [.allowAirPlay, .allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
        config.mode = AVAudioSession.Mode.videoChat.rawValue
        
        RTCAudioSessionConfiguration.setWebRTC(config)
    }
    
    @objc
    override public static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    public static func setup() {
        let videoEncoderFactory = RTCDefaultVideoEncoderFactory()
        let simulcastVideoEncoderFactory = RTCVideoEncoderFactorySimulcast(primary: videoEncoderFactory, fallback: videoEncoderFactory)
        let options = WebRTCModuleOptions.sharedInstance()
        options.videoEncoderFactory = simulcastVideoEncoderFactory
        options.audioProcessingModule = LKAudioProcessingManager.sharedInstance().audioProcessingModule
    }
    
    @objc(configureAudio:)
    public func configureAudio(_ config: NSDictionary) {
        guard let iOSConfig = config["ios"] as? NSDictionary
        else {
            return
        }
        
        let defaultOutput = iOSConfig["defaultOutput"] as? String ?? "speaker"
        
        let rtcConfig = RTCAudioSessionConfiguration()
        rtcConfig.category = AVAudioSession.Category.playAndRecord.rawValue
        
        if (defaultOutput == "earpiece") {
            rtcConfig.categoryOptions = [.allowAirPlay, .allowBluetooth, .allowBluetoothA2DP];
            rtcConfig.mode = AVAudioSession.Mode.voiceChat.rawValue
        } else {
            rtcConfig.categoryOptions = [.allowAirPlay, .allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
            rtcConfig.mode = AVAudioSession.Mode.videoChat.rawValue
        }
        RTCAudioSessionConfiguration.setWebRTC(rtcConfig)
    }
    
    @objc(startAudioSession)
    public func startAudioSession() {
        // intentionally left empty
    }
    
    @objc(stopAudioSession)
    public func stopAudioSession() {
        // intentionally left empty
    }
    
    @objc(showAudioRoutePicker)
    public func showAudioRoutePicker() {
        if #available(iOS 11.0, *) {
            let routePickerView = AVRoutePickerView()
            let subviews = routePickerView.subviews
            for subview in subviews {
                if subview.isKind(of: UIButton.self) {
                    let button = subview as! UIButton
                    button.sendActions(for: .touchUpInside)
                    break
                }
            }
        }
    }
    
    @objc(getAudioOutputsWithResolver:withRejecter:)
    public func getAudioOutputs(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock){
        resolve(["default", "force_speaker"])
    }
    
    @objc(selectAudioOutput:withResolver:withRejecter:)
    public func selectAudioOutput(_ deviceId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let session = AVAudioSession.sharedInstance()
        do {
            if (deviceId == "default") {
                try session.overrideOutputAudioPort(.none)
            } else if (deviceId == "force_speaker") {
                try session.overrideOutputAudioPort(.speaker)
            }
        } catch {
            reject("selectAudioOutput error", error.localizedDescription, error)
            return
        }
        
        resolve(nil)
    }
    
    @objc(setAppleAudioConfiguration:)
    public func setAppleAudioConfiguration(_ configuration: NSDictionary) {
        let session = RTCAudioSession.sharedInstance()
        let config = RTCAudioSessionConfiguration.webRTC()
        
        let appleAudioCategory = configuration["audioCategory"] as? String
        let appleAudioCategoryOptions = configuration["audioCategoryOptions"] as? [String]
        let appleAudioMode = configuration["audioMode"] as? String
        
        session.lockForConfiguration()
        
        var categoryChanged = false
        
        if let appleAudioCategoryOptions = appleAudioCategoryOptions {
            categoryChanged = true
            
            var newOptions: AVAudioSession.CategoryOptions = []
            for option in appleAudioCategoryOptions {
                if option == "mixWithOthers" {
                    newOptions.insert(.mixWithOthers)
                } else if option == "duckOthers" {
                    newOptions.insert(.duckOthers)
                } else if option == "allowBluetooth" {
                    newOptions.insert(.allowBluetooth)
                } else if option == "allowBluetoothA2DP" {
                    newOptions.insert(.allowBluetoothA2DP)
                } else if option == "allowAirPlay" {
                    newOptions.insert(.allowAirPlay)
                } else if option == "defaultToSpeaker" {
                    newOptions.insert(.defaultToSpeaker)
                }
            }
            config.categoryOptions = newOptions
        }
        
        if let appleAudioCategory = appleAudioCategory {
            categoryChanged = true
            config.category = AudioUtils.audioSessionCategoryFromString(appleAudioCategory).rawValue
        }
        
        if categoryChanged {
            do {
                try session.setCategory(AVAudioSession.Category(rawValue: config.category), with: config.categoryOptions)
            } catch {
                NSLog("Error setting category: %@", error.localizedDescription)
            }
        }
        
        if let appleAudioMode = appleAudioMode {
            let mode = AudioUtils.audioSessionModeFromString(appleAudioMode)
            config.mode = mode.rawValue
            do {
                try session.setMode(mode)
            } catch {
                NSLog("Error setting mode: %@", error.localizedDescription)
            }
        }
        
        session.unlockForConfiguration()
    }
    
    @objc(createVolumeProcessor:trackId:)
    public func createVolumeProcessor(_ pcId: NSNumber, trackId: String) -> String {
        let renderer = VolumeAudioRenderer(intervalMs: 40.0, eventEmitter: self)
        let reactTag = self.audioRendererManager.registerRenderer(renderer)
        renderer.reactTag = reactTag
        self.audioRendererManager.attach(renderer: renderer, pcId: pcId, trackId: trackId)
        
        return reactTag
    }

    @objc(deleteVolumeProcessor:pcId:trackId:)
    public func deleteVolumeProcessor(_ reactTag: String, pcId: NSNumber, trackId: String) -> Any? {
        self.audioRendererManager.detach(rendererByTag: reactTag, pcId: pcId, trackId: trackId)
        self.audioRendererManager.unregisterRenderer(forReactTag: reactTag)
        
        return nil
    }
    
    @objc(createMultibandVolumeProcessor:pcId:trackId:)
    public func createMultibandVolumeProcessor(_ options: NSDictionary, pcId: NSNumber, trackId: String) -> String {
        let bands = (options["bands"] as? NSNumber)?.intValue ?? 5
        let minFrequency = (options["minFrequency"] as? NSNumber)?.floatValue ?? 1000
        let maxFrequency = (options["maxFrequency"] as? NSNumber)?.floatValue ?? 8000
        let intervalMs = (options["updateInterval"] as? NSNumber)?.floatValue ?? 40
        
        let renderer = MultibandVolumeAudioRenderer(
            bands: bands,
            minFrequency: minFrequency,
            maxFrequency: maxFrequency,
            intervalMs: intervalMs,
            eventEmitter: self
        )
        let reactTag = self.audioRendererManager.registerRenderer(renderer)
        renderer.reactTag = reactTag
        self.audioRendererManager.attach(renderer: renderer, pcId: pcId, trackId: trackId)
        
        return reactTag
    }
    
    @objc(deleteMultibandVolumeProcessor:pcId:trackId:)
    public func deleteMultibandVolumeProcessor(_ reactTag: String, pcId: NSNumber, trackId: String) -> Any? {
        self.audioRendererManager.detach(rendererByTag: reactTag, pcId: pcId, trackId: trackId)
        self.audioRendererManager.unregisterRenderer(forReactTag: reactTag)
        
        return nil
    }
    
    override public func supportedEvents() -> [String]! {
        return [
            LKEvents.kEventVolumeProcessed,
            LKEvents.kEventMultibandProcessed,
        ]
    }
}
