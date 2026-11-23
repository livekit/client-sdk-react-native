package com.livekit.reactnative

import android.content.Context
import java.io.File
import java.io.IOException

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
        directory.listFiles { file -> file.name.endsWith(".tmp") }?.forEach { it.delete() }
        prune()
    }

    /**
     * Stores a batch and returns the ids evicted to stay inside the budgets. Throws when the batch
     * could not be written, so a caller never believes a lost batch is stored.
     */
    @Throws(IOException::class)
    fun put(id: String, body: ByteArray): List<String> {
        val destination = file(id) ?: throw IOException("invalid batch id: $id")
        // The system may clear cacheDir while the app is not running.
        directory.mkdirs()
        val temporary = File(directory, "$id.tmp")
        try {
            temporary.writeBytes(body)
            if (!temporary.renameTo(destination)) {
                throw IOException("could not move $temporary to $destination")
            }
        } catch (error: Exception) {
            temporary.delete()
            throw error
        }
        return prune()
    }

    fun pending(): List<String> =
        directory.list()?.filterNot { it.endsWith(".tmp") }?.sorted() ?: emptyList()

    fun read(id: String): ByteArray? = file(id)?.takeIf { it.isFile }?.readBytes()

    fun remove(id: String) {
        file(id)?.delete()
    }

    /** The batch's file, or null for an id that would escape the directory. */
    private fun file(id: String): File? =
        if (id.contains('/') || id.contains("..")) null else File(directory, id)

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
