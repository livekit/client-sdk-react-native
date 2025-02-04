package com.livekit.reactnative.audio.processing

import java.nio.ByteBuffer

/**
 * Interface for external audio processing.
 */
interface AudioProcessorInterface {
    /**
     * Check if the audio processing is enabled.
     */
    fun isEnabled(): Boolean

    /**
     * Get the name of the audio processing.
     */
    fun getName(): String

    /**
     * Initialize the audio processing.
     *
     * Note: audio processing methods will be called regardless of whether
     * [isEnabled] returns true or not.
     */
    fun initializeAudioProcessing(sampleRateHz: Int, numChannels: Int)

    /**
     * Called when the sample rate has changed.
     *
     * Note: audio processing methods will be called regardless of whether
     * [isEnabled] returns true or not.
     */
    fun resetAudioProcessing(newRate: Int)

    /**
     * Process the audio frame (10ms).
     *
     * Note: audio processing methods will be called regardless of whether
     * [isEnabled] returns true or not.
     */
    fun processAudio(numBands: Int, numFrames: Int, buffer: ByteBuffer)
}

/**
 * @suppress
 */
interface AuthedAudioProcessorInterface : AudioProcessorInterface {
    /**
     * @suppress
     */
    fun authenticate(url: String, token: String)
}
