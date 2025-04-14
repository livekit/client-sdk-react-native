package com.livekit.reactnative

import android.media.AudioAttributes
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.livekit.reactnative.audio.AudioDeviceKind
import com.livekit.reactnative.audio.AudioManagerUtils
import com.livekit.reactnative.audio.AudioSwitchManager
import com.livekit.reactnative.audio.processing.AudioSinkManager
import com.livekit.reactnative.audio.processing.MultibandVolumeProcessor
import com.livekit.reactnative.audio.processing.VolumeProcessor
import org.webrtc.audio.WebRtcAudioTrackHelper
import kotlin.time.Duration.Companion.milliseconds


class LivekitReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    val audioSinkManager = AudioSinkManager(reactContext)
    val audioManager = AudioSwitchManager(reactContext.applicationContext)
    override fun getName(): String {
        return "LivekitReactNativeModule"
    }

    @ReactMethod
    fun configureAudio(config: ReadableMap) {
        val androidConfig = config.getMap("android") ?: return

        if (androidConfig.hasKey("preferredOutputList")) {
            androidConfig.getArray("preferredOutputList")?.let { preferredOutputList ->
                val preferredDeviceList = preferredOutputList.toArrayList().mapNotNull { output ->
                    val outputStr = output as? String
                    AudioDeviceKind.fromTypeName(outputStr)?.audioDeviceClass
                }
                audioManager.preferredDeviceList = preferredDeviceList
            }
        }

        if (androidConfig.hasKey("audioTypeOptions")) {
            val audioTypeOptions = androidConfig.getMap("audioTypeOptions") ?: return

            val adm = LiveKitReactNative.audioDeviceModule
            val oldAudioAttributes = WebRtcAudioTrackHelper.getAudioOutputAttributes(adm)
            val attributesBuilder = AudioAttributes.Builder(oldAudioAttributes)

            if (audioTypeOptions.hasKey("manageAudioFocus")) {
                val manageFocus = audioTypeOptions.getBoolean("manageAudioFocus")
                audioManager.setManageAudioFocus(manageFocus)
            }
            if (audioTypeOptions.hasKey("audioMode")) {
                audioTypeOptions.getString("audioMode")?.let { audioModeString ->
                    val audioMode = AudioManagerUtils.audioModeFromString(audioModeString)
                    if (audioMode != null) {
                        audioManager.setAudioMode(audioMode)
                    }
                }
            }

            if (audioTypeOptions.hasKey("audioFocusMode")) {
                audioTypeOptions.getString("audioFocusMode")?.let { focusModeString ->
                    val focusMode = AudioManagerUtils.focusModeFromString(focusModeString)
                    if (focusMode != null) {
                        audioManager.setFocusMode(focusMode)
                    }
                }
            }

            if (audioTypeOptions.hasKey("audioStreamType")) {
                audioTypeOptions.getString("audioStreamType")?.let { streamTypeString ->
                    val streamType = AudioManagerUtils.audioStreamTypeFromString(streamTypeString)
                    if (streamType != null) {
                        audioManager.setAudioStreamType(streamType)
                    }
                }
            }

            if (audioTypeOptions.hasKey("audioAttributesUsageType")) {
                audioTypeOptions.getString("audioAttributesUsageType")?.let { usageTypeString ->
                    val usageType = AudioManagerUtils.audioAttributesUsageTypeFromString(usageTypeString)
                    if (usageType != null) {
                        audioManager.setAudioAttributesUsageType(usageType)
                        attributesBuilder.setUsage(usageType)
                    }
                }
            }

            if (audioTypeOptions.hasKey("audioAttributesContentType")) {
                audioTypeOptions.getString("audioAttributesContentType")?.let { contentTypeString ->
                    val contentType = AudioManagerUtils.audioAttributesContentTypeFromString(contentTypeString)
                    if (contentType != null) {
                        audioManager.setAudioAttributesContentType(contentType)
                        attributesBuilder.setContentType(contentType)
                    }
                }
            }

            if (audioTypeOptions.hasKey("forceHandleAudioRouting")) {
                val force = audioTypeOptions.getBoolean("forceHandleAudioRouting")
                audioManager.setForceHandleAudioRouting(force)
            }

            WebRtcAudioTrackHelper.setAudioOutputAttributes(adm, attributesBuilder.build())
        }
    }

    @ReactMethod
    fun startAudioSession() {
        audioManager.start()
    }

    @ReactMethod
    fun stopAudioSession() {
        audioManager.stop()
    }

    @ReactMethod
    fun getAudioOutputs(promise: Promise) {
        val deviceIds = audioManager.availableAudioDevices()
            .mapNotNull { device -> AudioDeviceKind.fromAudioDevice(device)?.typeName }
        promise.resolve(Arguments.makeNativeArray(deviceIds))
    }

    @ReactMethod
    fun selectAudioOutput(deviceId: String, promise: Promise) {
        audioManager.selectAudioOutput(AudioDeviceKind.fromTypeName(deviceId))
        promise.resolve(null)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun createVolumeProcessor(pcId: Int, trackId: String): String {
        val processor = VolumeProcessor(reactApplicationContext)
        val reactTag = audioSinkManager.registerSink(processor)
        audioSinkManager.attachSinkToTrack(processor, pcId, trackId)
        processor.reactTag = reactTag

        return reactTag
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun deleteVolumeProcessor(reactTag: String, pcId: Int, trackId: String) {
        audioSinkManager.detachSinkFromTrack(reactTag, pcId, trackId)
        audioSinkManager.unregisterSink(reactTag)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun createMultibandVolumeProcessor(options: ReadableMap, pcId: Int, trackId: String): String {
        val bands = options.getInt("bands")
        val minFrequency = options.getDouble("minFrequency")
        val maxFrequency = options.getDouble("maxFrequency")
        val intervalMs = options.getDouble("updateInterval")

        val processor = MultibandVolumeProcessor(
            minFrequency = minFrequency.toFloat(),
            maxFrequency = maxFrequency.toFloat(),
            barCount = bands,
            interval = intervalMs.milliseconds,
            reactContext = reactApplicationContext
        )
        val reactTag = audioSinkManager.registerSink(processor)
        processor.reactTag = reactTag
        audioSinkManager.attachSinkToTrack(processor, pcId, trackId)

        processor.start()

        return reactTag
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun deleteMultibandVolumeProcessor(reactTag: String, pcId: Int, trackId: String) {
        val volumeProcessor =
            audioSinkManager.getSink(reactTag) ?: throw IllegalArgumentException("Can't find volume processor for $reactTag")
        audioSinkManager.detachSinkFromTrack(volumeProcessor, pcId, trackId)
        audioSinkManager.unregisterSink(volumeProcessor)
        val multibandVolumeProcessor = volumeProcessor as? MultibandVolumeProcessor

        if (multibandVolumeProcessor != null) {
            multibandVolumeProcessor.release()
        } else {
            Log.w(name, "deleteMultibandVolumeProcessor called, but non-MultibandVolumeProcessor found?!")
        }
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    override fun invalidate() {
        LiveKitReactNative.invalidate(reactApplicationContext)
    }
}
