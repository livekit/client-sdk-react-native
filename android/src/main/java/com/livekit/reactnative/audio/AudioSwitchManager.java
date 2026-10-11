package com.livekit.reactnative.audio;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.twilio.audioswitch.AbstractAudioSwitch;
import com.twilio.audioswitch.AudioDevice;
import com.twilio.audioswitch.AudioSwitch;
import com.twilio.audioswitch.CommDeviceAudioSwitch;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

import kotlin.Unit;

public class AudioSwitchManager {
    private static final String TAG = "AudioSwitchManager";

    @NonNull
    private final Context context;

    public boolean loggingEnabled;

    @NonNull
    private volatile List<Class<? extends AudioDevice>> preferredDeviceList;

    // Volatile and nulled synchronously in stop() (rather than only inside the posted
    // teardown runnable) so that a subsequent start() reliably observes the teardown.
    @Nullable
    private volatile AbstractAudioSwitch audioSwitch;

    // AudioSwitch is not threadsafe, so all calls should be done through a single thread.
    @Nullable
    private volatile Handler handler;
    @Nullable
    private HandlerThread thread;

    /**
     * When true, AudioSwitchHandler will request audio focus on start and abandon on stop.
     *
     * Defaults to true.
     */
    private volatile boolean manageAudioFocus = true;

    /**
     * The audio focus mode to use while started.
     *
     * Defaults to [AudioManager.AUDIOFOCUS_GAIN].
     */
    private volatile int focusMode = AudioManager.AUDIOFOCUS_GAIN;

    /**
     * The audio mode to use while started.
     *
     * Defaults to AudioManager.MODE_IN_COMMUNICATION.
     */
    private volatile int audioMode = AudioManager.MODE_IN_COMMUNICATION;

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
    private volatile int audioStreamType = AudioManager.STREAM_VOICE_CALL;

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
    private volatile int audioAttributeUsageType = AudioAttributes.USAGE_VOICE_COMMUNICATION;

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
    private volatile int audioAttributeContentType = AudioAttributes.CONTENT_TYPE_SPEECH;

    /**
     * On certain Android devices, audio routing does not function properly and bluetooth microphones will not work
     * unless audio mode is set to [AudioManager.MODE_IN_COMMUNICATION] or [AudioManager.MODE_IN_CALL].
     *
     * AudioSwitchManager by default will not handle audio routing in those cases to avoid audio issues.
     *
     * If this set to true, AudioSwitchManager will attempt to do audio routing, though behavior is undefined.
     */
    private volatile boolean forceHandleAudioRouting = false;

    public AudioSwitchManager(@NonNull Context context) {
        this.context = context;

        List<Class<? extends AudioDevice>> defaultList = new ArrayList<>();
        defaultList.add(AudioDevice.BluetoothHeadset.class);
        defaultList.add(AudioDevice.WiredHeadset.class);
        defaultList.add(AudioDevice.Speakerphone.class);
        defaultList.add(AudioDevice.Earpiece.class);
        preferredDeviceList = defaultList;
    }

    public synchronized void start() {
        if (handler != null || thread != null) {
            Log.i(TAG, "AudioSwitchManager called start multiple times?");
        }

        HandlerThread currentThread = thread;
        if (currentThread == null) {
            currentThread = new HandlerThread("AudioSwitchManagerThread");
            currentThread.start();
            thread = currentThread;
        }
        Handler currentHandler = handler;
        if (currentHandler == null) {
            currentHandler = new Handler(currentThread.getLooper());
            handler = currentHandler;
        }

        if (audioSwitch == null) {
            final Handler startHandler = currentHandler;
            startHandler.removeCallbacksAndMessages(null);
            startHandler.postAtFrontOfQueue(() -> {
                AbstractAudioSwitch newAudioSwitch;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    newAudioSwitch = new CommDeviceAudioSwitch(
                            context,
                            loggingEnabled,
                            focusChange -> {
                            },
                            preferredDeviceList
                    );
                } else {
                    newAudioSwitch = new AudioSwitch(
                            context,
                            loggingEnabled,
                            focusChange -> {
                            },
                            preferredDeviceList
                    );
                }
                newAudioSwitch.setManageAudioFocus(manageAudioFocus);
                newAudioSwitch.setFocusMode(focusMode);
                newAudioSwitch.setAudioMode(audioMode);
                newAudioSwitch.setAudioStreamType(audioStreamType);
                newAudioSwitch.setAudioAttributeContentType(audioAttributeContentType);
                newAudioSwitch.setAudioAttributeUsageType(audioAttributeUsageType);
                newAudioSwitch.setForceHandleAudioRouting(forceHandleAudioRouting);

                // stop() may have run while this switch was being created; its posted teardown
                // saw no switch to stop. Publish under the lock only if this start is still current,
                // otherwise drop the switch (nothing is registered until start() below).
                // Once published, a later stop() posts its teardown behind this runnable.
                synchronized (AudioSwitchManager.this) {
                    if (handler != startHandler) {
                        return;
                    }
                    audioSwitch = newAudioSwitch;
                }
                newAudioSwitch.start((devices, currentDevice) -> Unit.INSTANCE);
                newAudioSwitch.activate();
            });
        }
    }

    public synchronized void stop() {
        // Null audioSwitch synchronously (under the lock) so a subsequent start() reliably
        // observes the teardown and re-creates the switch. The switch's stop() is still posted,
        // since AbstractAudioSwitch is not threadsafe.
        AbstractAudioSwitch switchToStop = audioSwitch;
        audioSwitch = null;

        Handler currentHandler = handler;
        if (currentHandler != null) {
            currentHandler.removeCallbacksAndMessages(null);
            currentHandler.postAtFrontOfQueue(() -> {
                if (switchToStop != null) {
                    switchToStop.stop();
                }
            });
        }
        HandlerThread currentThread = thread;
        if (currentThread != null) {
            currentThread.quitSafely();
        }

        handler = null;
        thread = null;
    }

    @Nullable
    public AudioDevice selectedAudioDevice() {
        AbstractAudioSwitch audioSwitchTemp = audioSwitch;
        if (audioSwitchTemp != null) {
            return audioSwitchTemp.getSelectedAudioDevice();
        } else {
            return null;
        }
    }

    @NonNull
    public List<AudioDevice> availableAudioDevices() {
        AbstractAudioSwitch audioSwitchTemp = audioSwitch;
        if (audioSwitchTemp != null) {
            return audioSwitchTemp.getAvailableAudioDevices();
        } else {
            return Collections.emptyList();
        }
    }

    public void selectAudioOutput(@NonNull Class<? extends AudioDevice> audioDeviceClass) {
        runOnAudioSwitch(sw -> {
            for (AudioDevice device : sw.getAvailableAudioDevices()) {
                if (device.getClass().equals(audioDeviceClass)) {
                    sw.selectDevice(device);
                    return;
                }
            }
        });
    }

    public void selectAudioOutput(@Nullable AudioDeviceKind kind) {
        if (kind != null) {
            selectAudioOutput(kind.audioDeviceClass);
        }
    }

    @NonNull
    public List<Class<? extends AudioDevice>> getPreferredDeviceList() {
        return preferredDeviceList;
    }

    /**
     * The preferred priority of audio devices to use. The first available audio device will be used.
     *
     * Changes to this value after [start] has been called will still be applied
     * to the underlying audio switch.
     */
    public void setPreferredDeviceList(@NonNull List<Class<? extends AudioDevice>> preferredDeviceList) {
        this.preferredDeviceList = preferredDeviceList;
        runOnAudioSwitch(sw -> sw.setPreferredDeviceList(preferredDeviceList));
    }

    public void setManageAudioFocus(boolean manage) {
        this.manageAudioFocus = manage;
        runOnAudioSwitch(sw -> sw.setManageAudioFocus(manage));
    }

    public void setFocusMode(int focusMode) {
        this.focusMode = focusMode;
        runOnAudioSwitch(sw -> sw.setFocusMode(focusMode));
    }

    public void setAudioMode(int audioMode) {
        this.audioMode = audioMode;
        runOnAudioSwitch(sw -> sw.setAudioMode(audioMode));
    }

    public void setAudioStreamType(int streamType) {
        this.audioStreamType = streamType;
        runOnAudioSwitch(sw -> sw.setAudioStreamType(streamType));
    }

    public void setAudioAttributesUsageType(int usageType) {
        this.audioAttributeUsageType = usageType;
        runOnAudioSwitch(sw -> sw.setAudioAttributeUsageType(usageType));
    }

    public void setAudioAttributesContentType(int contentType) {
        this.audioAttributeContentType = contentType;
        runOnAudioSwitch(sw -> sw.setAudioAttributeContentType(contentType));
    }

    public void setForceHandleAudioRouting(boolean force) {
        this.forceHandleAudioRouting = force;
        runOnAudioSwitch(sw -> sw.setForceHandleAudioRouting(force));
    }

    /**
     * Runs the action against the current audio switch on the audio switch thread.
     * No-op if not started.
     */
    private void runOnAudioSwitch(@NonNull Consumer<AbstractAudioSwitch> action) {
        Handler currentHandler = handler;
        if (currentHandler == null) {
            return;
        }
        Runnable runnable = () -> {
            AbstractAudioSwitch currentSwitch = audioSwitch;
            if (currentSwitch != null) {
                action.accept(currentSwitch);
            }
        };
        if (Looper.myLooper() == currentHandler.getLooper()) {
            runnable.run();
        } else {
            currentHandler.post(runnable);
        }
    }
}
