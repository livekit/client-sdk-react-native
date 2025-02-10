package com.livekit.reactnative.audio.processing

/**
 * Interface for controlling external audio processing.
 */
interface AudioProcessingController {
    /**
     * the audio processor to be used for capture post processing.
     */
    var capturePostProcessor: AudioProcessorInterface?

    /**
     * the audio processor to be used for render pre processing.
     */
    var renderPreProcessor: AudioProcessorInterface?

    /**
     * whether to bypass mode the render pre processing.
     */
    var bypassRenderPreProcessing: Boolean

    /**
     * whether to bypass the capture post processing.
     */
    var bypassCapturePostProcessing: Boolean

}
