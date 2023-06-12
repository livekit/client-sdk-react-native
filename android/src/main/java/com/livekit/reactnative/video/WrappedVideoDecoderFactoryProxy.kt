package com.livekit.reactnative.video

import com.oney.WebRTCModule.EglUtils
import org.webrtc.VideoCodecInfo
import org.webrtc.VideoDecoder
import org.webrtc.VideoDecoderFactory
import org.webrtc.WrappedVideoDecoderFactory

class WrappedVideoDecoderFactoryProxy : VideoDecoderFactory {

    private val factory by lazy { WrappedVideoDecoderFactory(EglUtils.getRootEglBaseContext()) }
    override fun createDecoder(codecInfo: VideoCodecInfo): VideoDecoder? {
        return factory.createDecoder(codecInfo)
    }

    override fun getSupportedCodecs(): Array<VideoCodecInfo> {
        return factory.supportedCodecs
    }
}