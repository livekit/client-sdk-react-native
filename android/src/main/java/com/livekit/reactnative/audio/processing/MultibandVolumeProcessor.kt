package com.livekit.reactnative.audio.processing

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.livekit.reactnative.audio.events.Events
import com.livekit.reactnative.audio.processing.fft.FFTAudioAnalyzer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.conflate
import kotlinx.coroutines.flow.transform
import kotlinx.coroutines.launch
import org.webrtc.AudioTrackSink
import java.nio.ByteBuffer
import kotlin.math.pow
import kotlin.math.round
import kotlin.math.roundToInt
import kotlin.math.sqrt
import kotlin.time.Duration

class MultibandVolumeProcessor(
    minFrequency: Float = 1000f,
    maxFrequency: Float = 8000f,
    barCount: Int,
    interval: Duration,
    private val reactContext: ReactContext,
) : BaseMultibandVolumeProcessor(minFrequency, maxFrequency, barCount, interval) {

    var reactTag: String? = null
    override fun onMagnitudesCollected(magnitudes: FloatArray) {
        val reactTag = this.reactTag ?: return
        val event = Arguments.createMap().apply {
            putArray("magnitudes", Arguments.fromArray(magnitudes))
            putString("id", reactTag)
        }
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(Events.LK_MULTIBAND_PROCESSED.name, event)
    }
}

abstract class BaseMultibandVolumeProcessor(
    val minFrequency: Float = 1000f,
    val maxFrequency: Float = 8000f,
    val barCount: Int,
    val interval: Duration,
) : AudioTrackSink {

    private val audioProcessor = FFTAudioAnalyzer()
    private var coroutineScope: CoroutineScope? = null

    abstract fun onMagnitudesCollected(magnitudes: FloatArray)

    fun start() {
        coroutineScope?.cancel()
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
        coroutineScope = scope
        scope.launch {
            val averages = FloatArray(barCount)
            audioProcessor.fftFlow.throttleLatest(interval).collect { fft ->
                val loPass: Int
                val hiPass: Int
                val audioFormat = audioProcessor.configuredInputFormat

                if (audioFormat != null) {
                    loPass = (minFrequency * fft.size / (audioFormat.sampleRate / 2)).roundToInt().coerceIn(fft.indices)
                    hiPass = (maxFrequency * fft.size / (audioFormat.sampleRate / 2)).roundToInt().coerceIn(fft.indices)
                } else {
                    loPass = 0
                    hiPass = fft.size
                }

                val sliced = fft.slice(loPass until hiPass)
                val magnitudes = calculateAmplitudeBarsFromFFT(sliced, averages, barCount)

                onMagnitudesCollected(magnitudes)
            }
        }
    }

    fun stop() {
        coroutineScope?.cancel()
        coroutineScope = null
    }

    fun release() {
        stop()
        audioProcessor.release()
    }

    override fun onData(
        audioData: ByteBuffer,
        bitsPerSample: Int,
        sampleRate: Int,
        numberOfChannels: Int,
        numberOfFrames: Int,
        absoluteCaptureTimestampMs: Long
    ) {
        val curAudioFormat = audioProcessor.configuredInputFormat
        if (curAudioFormat == null ||
            curAudioFormat.bitsPerSample != bitsPerSample ||
            curAudioFormat.sampleRate != sampleRate ||
            curAudioFormat.numberOfChannels != numberOfChannels
        ) {
            audioProcessor.configure(AudioFormat(bitsPerSample, sampleRate, numberOfChannels))
        }

        audioProcessor.queueInput(audioData)
    }
}

fun <T> Flow<T>.throttleLatest(interval: Duration): Flow<T> = this
    .conflate()
    .transform {
        emit(it)
        delay(interval)
    }


private const val MIN_CONST = 2f
private const val MAX_CONST = 25f

private fun calculateAmplitudeBarsFromFFT(
    fft: List<Float>,
    averages: FloatArray,
    barCount: Int,
): FloatArray {
    val amplitudes = FloatArray(barCount)
    if (fft.isEmpty()) {
        return amplitudes
    }

    // We average out the values over 3 occurrences (plus the current one), so big jumps are smoothed out
    // Iterate over the entire FFT result array.
    for (barIndex in 0 until barCount) {
        // Note: each FFT is a real and imaginary pair.
        // Scale down by 2 and scale back up to ensure we get an even number.
        val prevLimit = (round(fft.size.toFloat() / 2 * barIndex / barCount).toInt() * 2)
            .coerceIn(0, fft.size - 1)
        val nextLimit = (round(fft.size.toFloat() / 2 * (barIndex + 1) / barCount).toInt() * 2)
            .coerceIn(0, fft.size - 1)

        var accum = 0f
        // Here we iterate within this single band
        for (i in prevLimit until nextLimit step 2) {
            // Convert real and imaginary part to get energy

            val realSq = fft[i]
                .toDouble()
                .pow(2.0)
            val imaginarySq = fft[i + 1]
                .toDouble()
                .pow(2.0)
            val raw = sqrt(realSq + imaginarySq).toFloat()

            accum += raw
        }

        // A window might be empty which would result in a 0 division
        if ((nextLimit - prevLimit) != 0) {
            accum /= (nextLimit - prevLimit)
        } else {
            accum = 0.0f
        }

        val smoothingFactor = 5
        var avg = averages[barIndex]
        avg += (accum - avg / smoothingFactor)
        averages[barIndex] = avg

        var amplitude = avg.coerceIn(MIN_CONST, MAX_CONST)
        amplitude -= MIN_CONST
        amplitude /= (MAX_CONST - MIN_CONST)
        amplitudes[barIndex] = amplitude
    }

    return amplitudes
}
