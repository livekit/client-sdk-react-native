package com.livekit.reactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.livekit.reactnative.*
import com.livekit.reactnative.audio.*


class LivekitReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    val audioManager = AudioSwitchManager(reactContext.applicationContext)
    override fun getName(): String {
        return "LivekitReactNative"
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
