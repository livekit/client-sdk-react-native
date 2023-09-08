package com.livekit.reactnative

import android.app.Application
import android.content.Context
import android.os.Build
import com.livekit.reactnative.audio.AudioType
import com.livekit.reactnative.video.SimulcastVideoEncoderFactoryWrapper
import com.livekit.reactnative.video.WrappedVideoDecoderFactoryProxy
import com.oney.WebRTCModule.WebRTCModuleOptions
import org.webrtc.audio.JavaAudioDeviceModule

object LiveKitReactNative {

    /**
     * Initializes components required for LiveKit to work on Android.
     *
     * Must be called from your [Application.onCreate] method before any other react-native
     * initialization.
     */
    @JvmStatic
    @JvmOverloads
    fun setup(context: Context, audioType: AudioType = AudioType.CommunicationAudioType()) {
        val options = WebRTCModuleOptions.getInstance()
        options.videoEncoderFactory = SimulcastVideoEncoderFactoryWrapper(null, true, true)
        options.videoDecoderFactory = WrappedVideoDecoderFactoryProxy()

        val useHardwareAudioProcessing = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q

        options.audioDeviceModule = JavaAudioDeviceModule.builder(context)
            .setUseHardwareAcousticEchoCanceler(useHardwareAudioProcessing)
            .setUseHardwareNoiseSuppressor(useHardwareAudioProcessing)
            .setAudioAttributes(audioType.audioAttributes)
            .createAudioDeviceModule()
    }
}