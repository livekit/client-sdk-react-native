package com.livekit.reactnative

import com.facebook.react.bridge.*
import com.livekit.reactnative.audio.AudioDeviceKind
import com.livekit.reactnative.audio.AudioManagerUtils
import com.livekit.reactnative.audio.AudioSwitchManager


class LivekitReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    val audioManager = AudioSwitchManager(reactContext.applicationContext)
    override fun getName(): String {
        return "LivekitReactNative"
    }

    @ReactMethod
    fun configureAudio(config: ReadableMap) {
        val androidConfig = config.getMap("android") ?: return

        androidConfig.getArray("preferredOutputList")?.let { preferredOutputList ->
            val preferredDeviceList = preferredOutputList.toArrayList().mapNotNull { output ->
                val outputStr = output as? String
                AudioDeviceKind.fromTypeName(outputStr)?.audioDeviceClass
            }
            audioManager.preferredDeviceList = preferredDeviceList
        }

        androidConfig.getString("audioMode")?.let { audioModeString ->
            val audioMode = AudioManagerUtils.audioModeFromString(audioModeString)
            if (audioMode != null) {
                audioManager.setAudioMode(audioMode)
            }
        }
        androidConfig.getString("audioFocusMode")?.let { focusModeString ->
            val focusMode = AudioManagerUtils.focusModeFromString(focusModeString)
            if (focusMode != null) {
                audioManager.setFocusMode(focusMode)
            }
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
