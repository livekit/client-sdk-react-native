package com.livekit.reactnative.audio

import android.media.AudioAttributes
import android.media.AudioManager

sealed class AudioType(
    val audioMode: Int, 
    val audioAttributes: AudioAttributes, 
    val audioStreamType: Int
) {
    /**
     * An audio type for general media playback usage (i.e. listener-only use cases).
     *
     * Audio routing is handled automatically by the system in normal media mode,
     * and bluetooth microphones may not work on some devices.
     */
    class MediaAudioType : AudioType(
        AudioManager.MODE_NORMAL,
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        AudioManager.STREAM_MUSIC
    )

    /**
     * An audio type for communications (i.e. participating a call or otherwise
     * publishing local microphone).
     *
     * Audio routing can be manually controlled.
     */
    class CommunicationAudioType : AudioType(
        AudioManager.MODE_IN_COMMUNICATION,
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        AudioManager.STREAM_VOICE_CALL
    )

    /**
     * An audio type that takes in a user-defined [AudioAttributes] and audio stream type.
     */
    class CustomAudioType(audioMode: Int, audioAttributes: AudioAttributes, audioStreamType: Int) :
        AudioType(audioMode, audioAttributes, audioStreamType)
}