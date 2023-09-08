package com.livekit.reactnative.audio;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.twilio.audioswitch.AudioDevice;
import com.twilio.audioswitch.AudioSwitch;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import kotlin.Unit;
import kotlin.jvm.functions.Function2;

public class AudioSwitchManager {
    @NonNull
    private final Context context;
    @NonNull
    private final AudioManager audioManager;

    public boolean loggingEnabled;
    @NonNull
    public Function2<
            ? super List<? extends AudioDevice>,
            ? super AudioDevice,
            Unit> audioDeviceChangeListener = (devices, currentDevice) -> null;

    @NonNull
    public AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = (i -> {
    });

    @NonNull
    public List<Class<? extends AudioDevice>> preferredDeviceList;

    // AudioSwitch is not threadsafe, so all calls should be done on the main thread.
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Nullable
    private AudioSwitch audioSwitch;

    /**
     * When true, AudioSwitchHandler will request audio focus on start and abandon on stop.
     *
     * Defaults to true.
     */
    private boolean manageAudioFocus = true;

    /**
     * The audio focus mode to use while started.
     *
     * Defaults to [AudioManager.AUDIOFOCUS_GAIN].
     */
    private int focusMode = AudioManager.AUDIOFOCUS_GAIN;

    /**
     * The audio mode to use while started.
     *
     * Defaults to AudioManager.MODE_IN_COMMUNICATION.
     */
    private int audioMode = AudioManager.MODE_IN_COMMUNICATION;

    /**
     * The audio stream type to use when requesting audio focus on pre-O devices.
     *
     * Defaults to [AudioManager.STREAM_VOICE_CALL].
     *
     * Refer to this [compatibility table](https://source.android.com/docs/core/audio/attributes#compatibility)
     * to ensure that your values match between android versions.
     *
     * Note: Manual audio routing may not work appropriately when using non-default values.
     */
    private int audioStreamType = AudioManager.STREAM_VOICE_CALL;

    /**
     * The audio attribute usage type to use when requesting audio focus on devices O and beyond.
     *
     * Defaults to [AudioAttributes.USAGE_VOICE_COMMUNICATION].
     *
     * Refer to this [compatibility table](https://source.android.com/docs/core/audio/attributes#compatibility)
     * to ensure that your values match between android versions.
     *
     * Note: Manual audio routing may not work appropriately when using non-default values.
     */
    private int audioAttributeUsageType = AudioAttributes.USAGE_VOICE_COMMUNICATION;

    /**
     * The audio attribute content type to use when requesting audio focus on devices O and beyond.
     *
     * Defaults to [AudioAttributes.CONTENT_TYPE_SPEECH].
     *
     * Refer to this [compatibility table](https://source.android.com/docs/core/audio/attributes#compatibility)
     * to ensure that your values match between android versions.
     *
     * Note: Manual audio routing may not work appropriately when using non-default values.
     */
    private int audioAttributeContentType = AudioAttributes.CONTENT_TYPE_SPEECH;

    /**
     * On certain Android devices, audio routing does not function properly and bluetooth microphones will not work
     * unless audio mode is set to [AudioManager.MODE_IN_COMMUNICATION] or [AudioManager.MODE_IN_CALL].
     *
     * AudioSwitchManager by default will not handle audio routing in those cases to avoid audio issues.
     *
     * If this set to true, AudioSwitchManager will attempt to do audio routing, though behavior is undefined.
     */
    private boolean forceHandleAudioRouting = false;

    public AudioSwitchManager(@NonNull Context context) {
        this.context = context;
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

        preferredDeviceList = new ArrayList<>();
        preferredDeviceList.add(AudioDevice.BluetoothHeadset.class);
        preferredDeviceList.add(AudioDevice.WiredHeadset.class);
        preferredDeviceList.add(AudioDevice.Speakerphone.class);
        preferredDeviceList.add(AudioDevice.Earpiece.class);
    }

    public void start() {
        if (audioSwitch == null) {
            handler.removeCallbacksAndMessages(null);
            handler.postAtFrontOfQueue(() -> {
                audioSwitch = new AudioSwitch(
                        context,
                        loggingEnabled,
                        audioFocusChangeListener,
                        preferredDeviceList
                );
                audioSwitch.setManageAudioFocus(manageAudioFocus);
                audioSwitch.setFocusMode(focusMode);
                audioSwitch.setAudioMode(audioMode);
                audioSwitch.setAudioStreamType(audioStreamType);
                audioSwitch.setAudioAttributeContentType(audioAttributeContentType);
                audioSwitch.setAudioAttributeUsageType(audioAttributeUsageType);
                audioSwitch.setForceHandleAudioRouting(forceHandleAudioRouting);
                audioSwitch.start(audioDeviceChangeListener);
                audioSwitch.activate();
            });
        }
    }

    public void stop() {
        handler.removeCallbacksAndMessages(null);
        handler.postAtFrontOfQueue(() -> {
            if (audioSwitch != null) {
                audioSwitch.stop();
            }
            audioSwitch = null;
        });
    }

    public void setMicrophoneMute(boolean mute) {
        audioManager.setMicrophoneMute(mute);
    }

    @Nullable
    public AudioDevice selectedAudioDevice() {
        AudioSwitch audioSwitchTemp = audioSwitch;
        if (audioSwitchTemp != null) {
            return audioSwitchTemp.getSelectedAudioDevice();
        } else {
            return null;
        }
    }

    @NonNull
    public List<AudioDevice> availableAudioDevices() {
        AudioSwitch audioSwitchTemp = audioSwitch;
        if (audioSwitchTemp != null) {
            return audioSwitchTemp.getAvailableAudioDevices();
        } else {
            return Collections.emptyList();
        }
    }

    public void selectAudioOutput(@NonNull Class<? extends AudioDevice> audioDeviceClass) {
        handler.post(() -> {
            if (audioSwitch != null) {
                List<AudioDevice> devices = availableAudioDevices();
                AudioDevice audioDevice = null;

                for (AudioDevice device : devices) {
                    if (device.getClass().equals(audioDeviceClass)) {
                        audioDevice = device;
                        break;
                    }
                }

                if (audioDevice != null) {
                    audioSwitch.selectDevice(audioDevice);
                }
            }
        });
    }

    public void enableSpeakerphone(boolean enable) {
        if (enable) {
            audioManager.setSpeakerphoneOn(true);
        } else {
            audioManager.setSpeakerphoneOn(false);
        }
    }

    public void selectAudioOutput(@Nullable AudioDeviceKind kind) {
        if (kind != null) {
            selectAudioOutput(kind.audioDeviceClass);
        }
    }

    public void setManageAudioFocus(boolean manage) {
        this.manageAudioFocus = manage;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setManageAudioFocus(this.manageAudioFocus);
        }
    }

    public void setFocusMode(int focusMode) {
        this.focusMode = focusMode;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setFocusMode(this.focusMode);
        }
    }

    public void setAudioMode(int audioMode) {
        this.audioMode = audioMode;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setAudioMode(this.audioMode);
        }
    }

    public void setAudioStreamType(int streamType) {
        this.audioStreamType = streamType;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setAudioStreamType(this.audioStreamType);
        }
    }

    public void setAudioAttributesUsageType(int usageType) {
        this.audioAttributeUsageType = usageType;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setAudioAttributeUsageType(this.audioAttributeUsageType);
        }
    }

    public void setAudioAttributesContentType(int contentType) {
        this.audioAttributeContentType = contentType;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setAudioAttributeContentType(this.audioAttributeContentType);
        }
    }

    public void setForceHandleAudioRouting(boolean force) {
        this.forceHandleAudioRouting = force;
        if (audioSwitch != null) {
            Objects.requireNonNull(audioSwitch).setForceHandleAudioRouting(this.forceHandleAudioRouting);
        }
    }
}
