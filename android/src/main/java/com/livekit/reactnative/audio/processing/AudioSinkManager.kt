package com.livekit.reactnative.audio.processing

import com.facebook.react.bridge.ReactContext
import com.livekit.reactnative.LiveKitReactNative
import com.oney.WebRTCModule.WebRTCModule
import org.webrtc.AudioTrack
import org.webrtc.AudioTrackSink
import java.util.Collections
import java.util.UUID

private const val LOCAL_PC_ID = -1

class AudioSinkManager(val reactContext: ReactContext) {

    private val sinks = Collections.synchronizedMap(mutableMapOf<String, AudioTrackSink>())

    /**
     * Registers a sink to this manager.
     * @return the tag to identify this sink in future calls, such as [getSink] or [unregisterSink]
     */
    fun registerSink(sink: AudioTrackSink): String {
        val reactTag = UUID.randomUUID().toString()
        sinks[reactTag] = sink

        return reactTag
    }

    /**
     * Unregisters a sink from this manager. Does not detach the sink from tracks.
     */
    fun unregisterSink(reactTag: String) {
        sinks.remove(reactTag)
    }

    /**
     * Unregisters a sink from this manager. Does not detach the sink from tracks.
     */
    fun unregisterSink(sink: AudioTrackSink) {
        synchronized(sinks) {
            val keysToRemove = sinks.filterValues { it == sink }.keys
            for(key in keysToRemove) {
                sinks.remove(key)
            }
        }
    }

    fun getSink(reactTag: String) = sinks[reactTag]

    fun attachSinkToTrack(sink: AudioTrackSink, pcId: Int, trackId: String) {
        val webRTCModule =
            reactContext.getNativeModule(WebRTCModule::class.java) ?: throw IllegalArgumentException("Couldn't find WebRTC module!")

        val track = webRTCModule.getTrack(pcId, trackId) as? AudioTrack
            ?: throw IllegalArgumentException("Couldn't find audio track for pcID:${pcId}, trackId:${trackId}")

        if (pcId == LOCAL_PC_ID) {
            LiveKitReactNative.audioRecordSamplesDispatcher.registerSink(sink)
        } else {
            track.addSink(sink)
        }
    }

    fun detachSinkFromTrack(sink: AudioTrackSink, pcId: Int, trackId: String) {
        val webRTCModule =
            reactContext.getNativeModule(WebRTCModule::class.java) ?: throw IllegalArgumentException("Couldn't find WebRTC module!")
        val track = webRTCModule.getTrack(pcId, trackId) as? AudioTrack
            ?: return // fail silently

        if (pcId == LOCAL_PC_ID) {
            LiveKitReactNative.audioRecordSamplesDispatcher.unregisterSink(sink)
        } else {
            track.removeSink(sink)
        }
    }

    fun detachSinkFromTrack(sinkReactTag: String, pcId: Int, trackId: String) {
        val sink = sinks[sinkReactTag]
            ?: throw IllegalArgumentException("Couldn't find audio sink for react tag: $sinkReactTag")
        detachSinkFromTrack(sink, pcId, trackId)
    }
}