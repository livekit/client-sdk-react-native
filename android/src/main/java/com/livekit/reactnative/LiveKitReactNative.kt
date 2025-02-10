package com.livekit.reactnative

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.os.Build
import com.livekit.reactnative.audio.AudioType
import com.livekit.reactnative.audio.processing.AudioProcessingController
import com.livekit.reactnative.audio.processing.AudioRecordSamplesDispatcher
import com.livekit.reactnative.audio.processing.CustomAudioProcessingController
import com.livekit.reactnative.video.CustomVideoDecoderFactory
import com.livekit.reactnative.video.CustomVideoEncoderFactory
import com.oney.WebRTCModule.WebRTCModuleOptions
import org.webrtc.audio.JavaAudioDeviceModule
import java.util.concurrent.Callable

object LiveKitReactNative {


    private var audioType: AudioType = AudioType.CommunicationAudioType()

    @SuppressLint("StaticFieldLeak")
    private var adm: JavaAudioDeviceModule? = null

    val audioDeviceModule: JavaAudioDeviceModule
        get() {
            val adm = this.adm
                ?: throw IllegalStateException("Audio device module is not initialized! Did you remember to call LiveKitReactNative.setup in your Application.onCreate?")
            return adm
        }

    private lateinit var _audioProcessingController: AudioProcessingController

    val audioProcessingController: AudioProcessingController
        get() {
            if (!::_audioProcessingController.isInitialized) {
                throw IllegalStateException("audioProcessingController is not initialized! Did you remember to call LiveKitReactNative.setup in your Application.onCreate?")
            }
            return _audioProcessingController
        }


    lateinit var _audioRecordSamplesDispatcher: AudioRecordSamplesDispatcher

    val audioRecordSamplesDispatcher: AudioRecordSamplesDispatcher
        get() {
            if (!::_audioRecordSamplesDispatcher.isInitialized) {
                throw IllegalStateException("audioRecordSamplesDispatcher is not initialized! Did you remember to call LiveKitReactNative.setup in your Application.onCreate?")
            }
            return _audioRecordSamplesDispatcher
        }


    /**
     * Initializes components required for LiveKit to work on Android.
     *
     * Must be called from your [Application.onCreate] method before any other react-native
     * initialization.
     */
    @JvmStatic
    @JvmOverloads
    fun setup(
        context: Context,
        audioType: AudioType = AudioType.CommunicationAudioType()
    ) {
        _audioRecordSamplesDispatcher = AudioRecordSamplesDispatcher()

        this.audioType = audioType
        val options = WebRTCModuleOptions.getInstance()
        options.videoEncoderFactory = CustomVideoEncoderFactory(null, true, true)
        options.videoDecoderFactory = CustomVideoDecoderFactory()
        options.enableMediaProjectionService = true

        setupAdm(context)
        options.audioDeviceModule = adm
    }

    private fun setupAdm(context: Context) {
        val useHardwareAudioProcessing = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q

        adm = JavaAudioDeviceModule.builder(context)
            .setUseHardwareAcousticEchoCanceler(useHardwareAudioProcessing)
            .setUseHardwareNoiseSuppressor(useHardwareAudioProcessing)
            .setAudioAttributes(audioType.audioAttributes)
            .setSamplesReadyCallback(audioRecordSamplesDispatcher)
            .createAudioDeviceModule()
    }

    internal fun invalidate(context: Context) {
        val options = WebRTCModuleOptions.getInstance()
        if (options.audioDeviceModule == adm) {
            options.audioDeviceModule = null
        }
        adm?.release()
        adm = null

        setupAdm(context)
        options.audioDeviceModule = adm

        // CustomAudioProcessingController can't be instantiated before WebRTC is loaded.
        options.audioProcessingFactoryFactory = Callable {
            val apc = CustomAudioProcessingController()
            _audioProcessingController = apc
            return@Callable apc.externalAudioProcessor
        }

    }
}