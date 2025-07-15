package com.livekit.reactnative.audio.processing

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.livekit.reactnative.audio.events.Events
import org.webrtc.AudioTrackSink
import java.nio.ByteBuffer
import java.util.Arrays
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

class AudioSinkProcessor(private val reactContext: ReactContext) : BaseAudioSinkProcessor() {
    var reactTag: String? = null

    @OptIn(ExperimentalEncodingApi::class)
    override fun onAudioData(byteArray: ByteArray) {
        val reactTag = this.reactTag ?: return

        val encodedString = Base64.encode(byteArray)
        val event = Arguments.createMap().apply {
            putString("data", encodedString)
            putString("id", reactTag)
        }
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(Events.LK_AUDIO_DATA.name, event)
    }
}

abstract class BaseAudioSinkProcessor : AudioTrackSink {
    abstract fun onAudioData(byteArray: ByteArray)

    override fun onData(
        audioData: ByteBuffer,
        bitsPerSample: Int,
        sampleRate: Int,
        numberOfChannels: Int,
        numberOfFrames: Int,
        absoluteCaptureTimestampMs: Long
    ) {
        val byteArray: ByteArray

        if (audioData.hasArray()) {
            val audioArray = audioData.array()
            byteArray = Arrays.copyOfRange(audioArray, audioData.arrayOffset(), audioArray.size)
        } else {
            audioData.mark()
            audioData.position(0)

            byteArray = ByteArray(audioData.remaining())
            audioData.get(byteArray)
            audioData.reset()
        }

        onAudioData(byteArray)
    }
}