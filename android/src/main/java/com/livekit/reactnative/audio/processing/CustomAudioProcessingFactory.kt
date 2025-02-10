package com.livekit.reactnative.audio.processing

import org.webrtc.ExternalAudioProcessingFactory
import java.nio.ByteBuffer

/**
 * @suppress
 */
class CustomAudioProcessingController(
    /**
     * the audio processor to be used for capture post processing.
     */
    capturePostProcessor: AudioProcessorInterface? = null,

    /**
     * the audio processor to be used for render pre processing.
     */
    renderPreProcessor: AudioProcessorInterface? = null,

    /**
     * whether to bypass mode the render pre processing.
     */
    bypassRenderPreProcessing: Boolean = false,

    /**
     * whether to bypass the capture post processing.
     */
    bypassCapturePostProcessing: Boolean = false,
) : AudioProcessingController {

    val externalAudioProcessor = ExternalAudioProcessingFactory()

    override var capturePostProcessor: AudioProcessorInterface? = capturePostProcessor
        set(value) {
            field = value
            externalAudioProcessor.setCapturePostProcessing(
                value.toAudioProcessing(),
            )
        }

    override var renderPreProcessor: AudioProcessorInterface? = renderPreProcessor
        set(value) {
            field = value
            externalAudioProcessor.setRenderPreProcessing(
                value.toAudioProcessing(),
            )
        }

    override var bypassCapturePostProcessing: Boolean = bypassCapturePostProcessing
        set(value) {
            externalAudioProcessor.setBypassFlagForCapturePost(value)
        }

    override var bypassRenderPreProcessing: Boolean = bypassRenderPreProcessing
        set(value) {
            externalAudioProcessor.setBypassFlagForRenderPre(value)
        }

    private class AudioProcessingBridge(
        var audioProcessing: AudioProcessorInterface? = null,
    ) : ExternalAudioProcessingFactory.AudioProcessing {
        override fun initialize(sampleRateHz: Int, numChannels: Int) {
            audioProcessing?.initializeAudioProcessing(sampleRateHz, numChannels)
        }

        override fun reset(newRate: Int) {
            audioProcessing?.resetAudioProcessing(newRate)
        }

        override fun process(numBands: Int, numFrames: Int, buffer: ByteBuffer?) {
            audioProcessing?.processAudio(numBands, numFrames, buffer!!)
        }
    }

    private fun AudioProcessorInterface?.toAudioProcessing(): ExternalAudioProcessingFactory.AudioProcessing {
        return AudioProcessingBridge(this)
    }
}
