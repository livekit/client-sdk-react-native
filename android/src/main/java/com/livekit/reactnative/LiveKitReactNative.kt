package com.livekit.reactnative

import com.livekit.reactnative.video.SimulcastVideoEncoderFactoryWrapper
import com.livekit.reactnative.video.WrappedVideoDecoderFactoryProxy
import com.oney.WebRTCModule.WebRTCModuleOptions


object LiveKitReactNative {

    @JvmStatic
    fun setup() {
        val options = WebRTCModuleOptions.getInstance()
        options.videoEncoderFactory = SimulcastVideoEncoderFactoryWrapper(null, true, true)
        options.videoDecoderFactory = WrappedVideoDecoderFactoryProxy()
    }
}