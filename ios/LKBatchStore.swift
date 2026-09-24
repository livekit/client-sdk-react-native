import Foundation

/**
 * A directory of batches, mirroring the Rust core's `FileCache` so that a React Native app keeps
 * the caching semantics an iOS or Android app gets: a batch is written before the network is
 * tried, survives the process, and is removed only once the collector has taken it.
 *
 * Batch ids sort oldest-first as plain strings, so pruning never has to stat or parse anything.
 * Writes go to a temporary name and are renamed into place, so a crash never leaves half a batch
 * readable. Eviction is oldest-first above the byte, count and age budgets — and one batch always
 * survives, because a cache that prunes itself empty is worse than one that is slightly too big.
 */
@objc(LKBatchStore)
public class LKBatchStore: NSObject {
    private let directory: URL
    private let maxBytes: Int
    private let maxBatches: Int
    private let maxAge: TimeInterval

    @objc public init(maxBytes: Int, maxBatches: Int, maxAgeSeconds: Double) {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        directory = caches.appendingPathComponent("livekit-telemetry", isDirectory: true)
        self.maxBytes = maxBytes
        self.maxBatches = maxBatches
        maxAge = maxAgeSeconds
        super.init()
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        _ = prune()
    }

    /// Stores a batch and returns the ids evicted to stay inside the budgets.
    @objc public func put(id: String, body: Data) -> [String] {
        let destination = directory.appendingPathComponent(id)
        let temporary = directory.appendingPathComponent("\(id).tmp")
        guard (try? body.write(to: temporary)) != nil else { return [] }
        do {
            _ = try FileManager.default.replaceItemAt(destination, withItemAt: temporary)
        } catch {
            try? FileManager.default.removeItem(at: temporary)
            return []
        }
        return prune()
    }

    @objc public func pending() -> [String] {
        let names = (try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? []
        return names.filter { !$0.hasSuffix(".tmp") }.sorted()
    }

    @objc public func read(id: String) -> Data? {
        try? Data(contentsOf: directory.appendingPathComponent(id))
    }

    @objc public func remove(id: String) {
        try? FileManager.default.removeItem(at: directory.appendingPathComponent(id))
    }

    @objc public func clear() {
        for id in pending() { remove(id: id) }
    }

    /// Drops what is too old, then the oldest until the rest fits. Returns what it dropped.
    private func prune() -> [String] {
        var evicted: [String] = []
        var sizes: [(id: String, bytes: Int)] = []
        var total = 0
        let cutoff = Date().addingTimeInterval(-maxAge)

        for id in pending() {
            let path = directory.appendingPathComponent(id)
            let attributes = try? FileManager.default.attributesOfItem(atPath: path.path)
            let modified = attributes?[.modificationDate] as? Date ?? Date()
            let bytes = (attributes?[.size] as? NSNumber)?.intValue ?? 0
            if modified < cutoff {
                remove(id: id)
                evicted.append(id)
                continue
            }
            sizes.append((id, bytes))
            total += bytes
        }

        var index = 0
        while (total > maxBytes || sizes.count - index > maxBatches) && sizes.count - index > 1 {
            let oldest = sizes[index]
            remove(id: oldest.id)
            evicted.append(oldest.id)
            total -= oldest.bytes
            index += 1
        }
        return evicted
    }
}
