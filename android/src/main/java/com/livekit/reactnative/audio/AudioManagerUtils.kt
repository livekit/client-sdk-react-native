package com.livekit.reactnative.audio

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
}