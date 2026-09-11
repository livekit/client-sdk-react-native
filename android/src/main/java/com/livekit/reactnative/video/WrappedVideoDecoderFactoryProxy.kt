package com.livekit.reactnative.video

import com.oney.WebRTCModule.EglUtils
import livekit.org.webrtc.VideoCodecInfo
import livekit.org.webrtc.VideoDecoder
import livekit.org.webrtc.VideoDecoderFactory
import livekit.org.webrtc.WrappedVideoDecoderFactory

class WrappedVideoDecoderFactoryProxy : VideoDecoderFactory {

    private val factory by lazy { WrappedVideoDecoderFactory(EglUtils.getRootEglBaseContext()) }
    override fun createDecoder(codecInfo: VideoCodecInfo): VideoDecoder? {
        return factory.createDecoder(codecInfo)
    }

    override fun getSupportedCodecs(): Array<VideoCodecInfo> {
        return factory.supportedCodecs
    }
}