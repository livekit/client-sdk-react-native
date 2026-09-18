package com.livekit.reactnative

import android.content.Context
import java.io.File

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
class BatchStore(
    context: Context,
    private val maxBytes: Long,
    private val maxBatches: Int,
    private val maxAgeMillis: Long,
) {
    private val directory = File(context.cacheDir, "livekit-telemetry").apply { mkdirs() }

    init {
        prune()
    }

    /** Stores a batch and returns the ids evicted to stay inside the budgets. */
    fun put(id: String, body: ByteArray): List<String> {
        val temporary = File(directory, "$id.tmp")
        val destination = File(directory, id)
        return try {
            temporary.writeBytes(body)
            if (!temporary.renameTo(destination)) {
                temporary.delete()
                return emptyList()
            }
            prune()
        } catch (error: Exception) {
            temporary.delete()
            emptyList()
        }
    }

    fun pending(): List<String> =
        directory.list()?.filterNot { it.endsWith(".tmp") }?.sorted() ?: emptyList()

    fun read(id: String): ByteArray? = File(directory, id).takeIf { it.isFile }?.readBytes()

    fun remove(id: String) {
        File(directory, id).delete()
    }

    fun clear() {
        pending().forEach { remove(it) }
    }

    /** Drops what is too old, then the oldest until the rest fits. Returns what it dropped. */
    private fun prune(): List<String> {
        val evicted = mutableListOf<String>()
        val cutoff = System.currentTimeMillis() - maxAgeMillis
        val kept = mutableListOf<Pair<String, Long>>()
        var total = 0L

        for (id in pending()) {
            val file = File(directory, id)
            if (file.lastModified() < cutoff) {
                file.delete()
                evicted.add(id)
                continue
            }
            kept.add(id to file.length())
            total += file.length()
        }

        var index = 0
        while ((total > maxBytes || kept.size - index > maxBatches) && kept.size - index > 1) {
            val (id, bytes) = kept[index]
            remove(id)
            evicted.add(id)
            total -= bytes
            index += 1
        }
        return evicted
    }
}
