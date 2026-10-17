package com.livekit.reactnative.audio.processing

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.livekit.reactnative.audio.events.Events
import livekit.org.webrtc.AudioTrackSink
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.round
import kotlin.math.sqrt

class VolumeProcessor(private val reactContext: ReactContext) : BaseVolumeProcessor() {
    var reactTag: String? = null

    override fun onVolumeCalculated(volume: Double) {
        val reactTag = this.reactTag ?: return
        val event = Arguments.createMap().apply {
            putDouble("volume", volume)
            putString("id", reactTag)
        }
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(Events.LK_VOLUME_PROCESSED.name, event)
    }
}

abstract class BaseVolumeProcessor : AudioTrackSink {
    abstract fun onVolumeCalculated(volume: Double)

    override fun onData(
        audioData: ByteBuffer,
        bitsPerSample: Int,
        sampleRate: Int,
        numberOfChannels: Int,
        numberOfFrames: Int,
        absoluteCaptureTimestampMs: Long
    ) {
        // WebRTC hands us a JNI direct buffer, which Java defaults to big-endian,
        // while the PCM samples are native (little-endian). Read through a view
        // in native order so the sink's buffer is left untouched.
        val samples = audioData.duplicate().order(ByteOrder.nativeOrder())
        samples.position(0)
        var average = 0L
        val bytesPerSample = bitsPerSample / 8

        // RMS average calculation
        for (i in 0 until numberOfFrames) {
            val value = when (bytesPerSample) {
                1 -> samples.get().toLong()
                2 -> samples.getShort().toLong()
                4 -> samples.getInt().toLong()
                else -> throw IllegalArgumentException()
            }

            average += value * value
        }

        average /= numberOfFrames

        val volume = round(sqrt(average.toDouble()))
        val volumeNormalized = when (bytesPerSample) {
            1 -> volume / Byte.MAX_VALUE
            2 -> volume / Short.MAX_VALUE
            4 -> volume / Int.MAX_VALUE
            else -> throw IllegalArgumentException()
        }

        onVolumeCalculated(volumeNormalized)
    }
}