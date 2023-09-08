package com.livekit.reactnative.audio

import android.media.AudioAttributes
import android.media.AudioManager
import android.util.Log


object AudioManagerUtils {
    private const val TAG = "AudioManagerUtils"

    fun audioModeFromString(audioModeString: String?): Int? {
        if (audioModeString == null) {
            return null
        }

        var audioMode: Int? = null
        when (audioModeString) {
            "normal" -> audioMode = AudioManager.MODE_NORMAL
            "callScreening" -> audioMode = AudioManager.MODE_CALL_SCREENING
            "inCall" -> audioMode = AudioManager.MODE_IN_CALL
            "inCommunication" -> audioMode = AudioManager.MODE_IN_COMMUNICATION
            "ringtone" -> audioMode = AudioManager.MODE_RINGTONE
            else -> Log.w(TAG, "Unknown audio mode: $audioModeString")
        }

        return audioMode
    }

    fun focusModeFromString(focusModeString: String?): Int? {
        if (focusModeString == null) {
            return null
        }

        var focusMode: Int? = null
        when (focusModeString) {
            "gain" -> focusMode = AudioManager.AUDIOFOCUS_GAIN
            "gainTransient" -> focusMode = AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            "gainTransientExclusive" -> focusMode = AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE
            "gainTransientMayDuck" -> focusMode = AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            else -> Log.w(TAG, "Unknown audio focus mode: $focusModeString")
        }

        return focusMode
    }

    fun audioAttributesUsageTypeFromString(usageTypeString: String?): Int? {
        if (usageTypeString == null) {
            return null
        }

        val usageType: Int? = when (usageTypeString) {
            "alarm" -> AudioAttributes.USAGE_ALARM
            "assistanceAccessibility" -> AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY
            "assistanceNavigationGuidance" -> AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE
            "assistanceSonification" -> AudioAttributes.USAGE_ASSISTANCE_SONIFICATION
            "assistant" -> AudioAttributes.USAGE_ASSISTANT
            "game" -> AudioAttributes.USAGE_GAME
            "media" -> AudioAttributes.USAGE_MEDIA
            "notification" -> AudioAttributes.USAGE_NOTIFICATION
            "notificationEvent" -> AudioAttributes.USAGE_NOTIFICATION_EVENT
            "notificationRingtone" -> AudioAttributes.USAGE_NOTIFICATION_RINGTONE
            "unknown" -> AudioAttributes.USAGE_UNKNOWN
            "voiceCommunication" -> AudioAttributes.USAGE_VOICE_COMMUNICATION
            "voiceCommunicationSignalling" -> AudioAttributes.USAGE_VOICE_COMMUNICATION_SIGNALLING
            else -> {
                Log.w(TAG, "Unknown audio attributes usage type: $usageTypeString")
                null
            }
        }

        return usageType
    }

    fun audioAttributesContentTypeFromString(contentTypeString: String?): Int? {
        if (contentTypeString == null) {
            return null
        }

        val contentType = when (contentTypeString) {
            "movie" -> AudioAttributes.CONTENT_TYPE_MOVIE
            "music" -> AudioAttributes.CONTENT_TYPE_MUSIC
            "sonification" -> AudioAttributes.CONTENT_TYPE_SONIFICATION
            "speech" -> AudioAttributes.CONTENT_TYPE_SPEECH
            "unknown" -> AudioAttributes.CONTENT_TYPE_UNKNOWN
            else -> {
                Log.w(TAG, "Unknown audio attributes content type: $contentTypeString")
                null
            }
        }

        return contentType
    }

    fun audioStreamTypeFromString(streamTypeString: String?): Int? {
        if (streamTypeString == null) {
            return null
        }

        val streamType = when (streamTypeString) {
            "accessibility" -> AudioManager.STREAM_ACCESSIBILITY
            "alarm" -> AudioManager.STREAM_ALARM
            "dtmf" -> AudioManager.STREAM_DTMF
            "music" -> AudioManager.STREAM_MUSIC
            "notification" -> AudioManager.STREAM_NOTIFICATION
            "ring" -> AudioManager.STREAM_RING
            "system" -> AudioManager.STREAM_SYSTEM
            "voiceCall" -> AudioManager.STREAM_VOICE_CALL
            else -> {
                Log.w(TAG, "Unknown audio stream type: $streamTypeString")
                null
            }
        }

        return streamType
    }
}