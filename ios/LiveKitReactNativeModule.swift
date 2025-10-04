import livekit_react_native_webrtc
import AVFoundation
import AVFAudio
import React

struct LKEvents {
    static let kEventVolumeProcessed = "LK_VOLUME_PROCESSED";
    static let kEventMultibandProcessed = "LK_MULTIBAND_PROCESSED";
    static let kEventAudioData = "LK_AUDIO_DATA";
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

    @objc(startAudioSession:withRejecter:)
    public func startAudioSession(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer {
            session.unlockForConfiguration()
        }

        do {
            try session.setActive(true)
            resolve(nil)
        } catch {
            reject("startAudioSession", "Error activating audio session: \(error.localizedDescription)", error)
        }
    }

    @objc(stopAudioSession:withRejecter:)
    public func stopAudioSession(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let session = RTCAudioSession.sharedInstance()
        session.lockForConfiguration()
        defer {
            session.unlockForConfiguration()
        }

        do {
            try session.setActive(false)
            resolve(nil)
        } catch {
            reject("stopAudioSession", "Error deactivating audio session: \(error.localizedDescription)", error)
        }
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

    @objc(setAppleAudioConfiguration:withResolver:withRejecter:)
    public func setAppleAudioConfiguration(_ configuration: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let session = RTCAudioSession.sharedInstance()
        let config = RTCAudioSessionConfiguration.webRTC()

        let appleAudioCategory = configuration["audioCategory"] as? String
        let appleAudioCategoryOptions = configuration["audioCategoryOptions"] as? [String]
        let appleAudioMode = configuration["audioMode"] as? String

        session.lockForConfiguration()
        defer {
            session.unlockForConfiguration()
        }

        if let appleAudioCategory = appleAudioCategory {
            config.category = AudioUtils.audioSessionCategoryFromString(appleAudioCategory).rawValue
        }

        if let appleAudioCategoryOptions = appleAudioCategoryOptions {
            config.categoryOptions = AudioUtils.audioSessionCategoryOptionsFromStrings(appleAudioCategoryOptions)
        }

        if let appleAudioMode = appleAudioMode {
            config.mode = AudioUtils.audioSessionModeFromString(appleAudioMode).rawValue
        }

        do {
            try session.setConfiguration(config)
            resolve(nil)
        } catch {
            reject("setAppleAudioConfiguration", "Error setting category: \(error.localizedDescription)", error)
            return
        }

    }

    @objc(createAudioSinkListener:trackId:)
    public func createAudioSinkListener(_ pcId: NSNumber, trackId: String) -> String {
        let renderer = AudioSinkRenderer(eventEmitter: self)
        let reactTag = self.audioRendererManager.registerRenderer(renderer)
        renderer.reactTag = reactTag
        self.audioRendererManager.attach(renderer: renderer, pcId: pcId, trackId: trackId)

        return reactTag
    }

    @objc(deleteAudioSinkListener:pcId:trackId:)
    public func deleteAudioSinkListener(_ reactTag: String, pcId: NSNumber, trackId: String) -> Any? {
        self.audioRendererManager.detach(rendererByTag: reactTag, pcId: pcId, trackId: trackId)
        self.audioRendererManager.unregisterRenderer(forReactTag: reactTag)

        return nil
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

    @objc(setDefaultAudioTrackVolume:)
    public func setDefaultAudioTrackVolume(_ volume: NSNumber) -> Any? {
        let options = WebRTCModuleOptions.sharedInstance()
        options.defaultTrackVolume = volume.doubleValue

        return nil
    }

    override public func supportedEvents() -> [String]! {
        return [
            LKEvents.kEventVolumeProcessed,
            LKEvents.kEventMultibandProcessed,
            LKEvents.kEventAudioData,
        ]
    }
}
