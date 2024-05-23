package com.livekit.reactnative

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import com.facebook.react.bridge.*
import com.livekit.reactnative.audio.AudioDeviceKind
import com.livekit.reactnative.audio.AudioManagerUtils
import com.livekit.reactnative.audio.AudioSwitchManager
import org.webrtc.audio.WebRtcAudioTrackHelper


class LivekitReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    val audioManager = AudioSwitchManager(reactContext.applicationContext)
    override fun getName(): String {
        return "LivekitReactNative"
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
}
