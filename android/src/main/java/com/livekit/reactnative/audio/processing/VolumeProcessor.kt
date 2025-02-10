package com.livekit.reactnative.audio.processing

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.livekit.reactnative.audio.events.Events
import org.webrtc.AudioTrackSink
import java.nio.ByteBuffer
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
        audioData.mark()
        audioData.position(0)
        var average = 0L
        val bytesPerSample = bitsPerSample / 8

        // RMS average calculation
        for (i in 0 until numberOfFrames) {
            val value = when (bytesPerSample) {
                1 -> audioData.get().toLong()
                2 -> audioData.getShort().toLong()
                4 -> audioData.getInt().toLong()
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
        audioData.reset()

        onVolumeCalculated(volumeNormalized)
    }
}