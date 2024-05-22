package org.webrtc.audio

import android.media.AudioAttributes

object WebRtcAudioTrackHelper {

    fun getAudioOutputAttributes(adm: JavaAudioDeviceModule): AudioAttributes {
        return adm.audioOutput.audioAttributes ?: AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
    }

    fun setAudioOutputAttributes(
        adm: JavaAudioDeviceModule,
        audioAttributes: AudioAttributes,
    ) {
        adm.audioOutput.audioAttributes = audioAttributes
    }
}