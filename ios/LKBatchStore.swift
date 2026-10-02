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
        for name in names() where name.hasSuffix(".tmp") { remove(id: name) }
        _ = prune()
    }

    /// Stores a batch and returns the ids evicted to stay inside the budgets. Throws when the
    /// batch could not be written, so a caller never believes a lost batch is stored.
    @objc public func put(id: String, body: Data) throws -> [String] {
        guard let destination = url(id) else { throw CocoaError(.fileWriteInvalidFileName) }
        // The system may purge Caches while the app is not running.
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let temporary = directory.appendingPathComponent("\(id).tmp")
        do {
            try body.write(to: temporary)
            try FileManager.default.moveItem(at: temporary, to: destination)
        } catch {
            try? FileManager.default.removeItem(at: temporary)
            throw error
        }
        return prune()
    }

    @objc public func pending() -> [String] {
        names().filter { !$0.hasSuffix(".tmp") }.sorted()
    }

    private func names() -> [String] {
        (try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? []
    }

    @objc public func read(id: String) -> Data? {
        url(id).flatMap { try? Data(contentsOf: $0) }
    }

    @objc public func remove(id: String) {
        if let url = url(id) { try? FileManager.default.removeItem(at: url) }
    }

    /// The batch's file, or nil for an id that would escape the directory.
    private func url(_ id: String) -> URL? {
        id.contains("/") || id.contains("..") ? nil : directory.appendingPathComponent(id)
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
