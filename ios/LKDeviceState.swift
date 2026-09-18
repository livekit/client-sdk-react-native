import Foundation

/**
 * Thermal state, low power mode and memory pressure: the three signals SPEC's cadence policy needs
 * and no browser can answer. The pipeline never measures any of them itself — measuring CPU costs
 * CPU — so each value here is the OS's own judgement, reported when it changes.
 *
 * Values are SPEC's names, not Apple's, so that a record from iOS and a record from Android say the
 * same thing.
 */
@objc(LKDeviceState)
public class LKDeviceState: NSObject {
    /// One event carrying whatever changed; JS merges it into the state it already has.
    @objc public static let eventName = "LK_DEVICE_STATE"

    private let onChange: ([String: Any]) -> Void
    private var memorySource: DispatchSourceMemoryPressure?

    @objc public init(onChange: @escaping ([String: Any]) -> Void) {
        self.onChange = onChange
        super.init()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(thermalChanged),
            name: ProcessInfo.thermalStateDidChangeNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(powerChanged),
            name: Notification.Name.NSProcessInfoPowerStateDidChange,
            object: nil
        )

        // DispatchSource reports all three levels, including the return to normal that
        // `didReceiveMemoryWarning` never sends.
        let source = DispatchSource.makeMemoryPressureSource(
            eventMask: [.normal, .warning, .critical],
            queue: .main
        )
        source.setEventHandler { [weak self, weak source] in
            guard let self, let event = source?.data else { return }
            self.onChange(["memory": LKDeviceState.memoryName(event)])
        }
        source.resume()
        memorySource = source
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        memorySource?.cancel()
    }

    /// Everything that is a state rather than an edge, for the first report.
    @objc public func snapshot() -> [String: Any] {
        let info = ProcessInfo.processInfo
        return [
            "thermal": LKDeviceState.thermalName(info.thermalState),
            "lowPower": info.isLowPowerModeEnabled,
        ]
    }

    @objc private func thermalChanged() {
        onChange(["thermal": LKDeviceState.thermalName(ProcessInfo.processInfo.thermalState)])
    }

    @objc private func powerChanged() {
        onChange(["lowPower": ProcessInfo.processInfo.isLowPowerModeEnabled])
    }

    private static func thermalName(_ state: ProcessInfo.ThermalState) -> String {
        switch state {
        case .nominal: return "nominal"
        case .fair: return "fair"
        case .serious: return "serious"
        case .critical: return "critical"
        @unknown default: return "nominal"
        }
    }

    private static func memoryName(_ event: DispatchSource.MemoryPressureEvent) -> String {
        if event.contains(.critical) { return "critical" }
        if event.contains(.warning) { return "warning" }
        return "normal"
    }
}
