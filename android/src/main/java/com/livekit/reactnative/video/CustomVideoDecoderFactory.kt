/*
 * Copyright 2023-2024 LiveKit, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.livekit.reactnative.video

import com.oney.WebRTCModule.webrtcutils.SoftwareVideoDecoderFactoryProxy
import org.webrtc.EglBase
import org.webrtc.SoftwareVideoDecoderFactory
import org.webrtc.VideoCodecInfo
import org.webrtc.VideoDecoder
import org.webrtc.VideoDecoderFactory
import org.webrtc.WrappedVideoDecoderFactory

open class CustomVideoDecoderFactory(
    private var forceSWCodec: Boolean = false,
    private var forceSWCodecs: List<String> = listOf("VP9"),
) : VideoDecoderFactory {
    private val softwareVideoDecoderFactory = SoftwareVideoDecoderFactoryProxy()
    private val wrappedVideoDecoderFactory = WrappedVideoDecoderFactoryProxy()

    /**
     * Set to true to force software codecs.
     */
    fun setForceSWCodec(forceSWCodec: Boolean) {
        this.forceSWCodec = forceSWCodec
    }

    /**
     * Set a list of codecs for which to use software codecs.
     */
    fun setForceSWCodecList(forceSWCodecs: List<String>) {
        this.forceSWCodecs = forceSWCodecs
    }

    override fun createDecoder(videoCodecInfo: VideoCodecInfo): VideoDecoder? {
        if (forceSWCodec) {
            return softwareVideoDecoderFactory.createDecoder(videoCodecInfo)
        }
        if (forceSWCodecs.isNotEmpty()) {
            if (forceSWCodecs.contains(videoCodecInfo.name)) {
                return softwareVideoDecoderFactory.createDecoder(videoCodecInfo)
            }
        }
        return wrappedVideoDecoderFactory.createDecoder(videoCodecInfo)
    }

    override fun getSupportedCodecs(): Array<VideoCodecInfo> {
        return if (forceSWCodec && forceSWCodecs.isEmpty()) {
            softwareVideoDecoderFactory.supportedCodecs
        } else {
            wrappedVideoDecoderFactory.supportedCodecs
        }
    }
}
