package com.livekit.reactnative.audio;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import android.content.Context;
import android.content.ContextWrapper;
import android.media.AudioManager;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;

import androidx.test.core.app.ApplicationProvider;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.lang.reflect.Field;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Start/stop races in AudioSwitchManager. Each test blocks the audio thread at the point where
 * the race happens, then checks the audio mode the switches leave behind.
 *
 * SDK 30 uses AudioSwitch and SDK 33 uses CommDeviceAudioSwitch.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = {30, 33})
public class AudioSwitchManagerTest {

    private AudioManager audioManager;
    private GatedContext context;

    @Before
    public void setUp() {
        Context app = ApplicationProvider.getApplicationContext();
        audioManager = (AudioManager) app.getSystemService(Context.AUDIO_SERVICE);
        audioManager.setMode(AudioManager.MODE_NORMAL);
        context = new GatedContext(app);
    }

    @Test
    public void quickStopStartEndsActive() throws Exception {
        AudioSwitchManager manager = new AudioSwitchManager(context);
        manager.start();
        settle(manager);
        manager.stop();
        manager.start();
        settle(manager);

        assertNotNull(field(manager, "audioSwitch"));
        assertEquals(AudioManager.MODE_IN_COMMUNICATION, audioManager.getMode());
    }

    @Test
    public void stopDuringCreationDropsSwitch() throws Exception {
        AudioSwitchManager manager = new AudioSwitchManager(context);
        context.blockNextCreation();
        manager.start();
        await(context.creating);
        manager.stop();
        context.unblock.countDown();
        settle(manager);

        assertNull(field(manager, "audioSwitch"));
        assertEquals(AudioManager.MODE_NORMAL, audioManager.getMode());
    }

    @Test
    public void secondStartDuringCreationLeavesNoSwitchActiveAfterStop() throws Exception {
        AudioSwitchManager manager = new AudioSwitchManager(context);
        context.blockNextCreation();
        manager.start();
        await(context.creating);
        manager.start();
        context.unblock.countDown();
        settle(manager);
        assertEquals(AudioManager.MODE_IN_COMMUNICATION, audioManager.getMode());

        manager.stop();
        settle(manager);
        assertEquals(AudioManager.MODE_NORMAL, audioManager.getMode());
    }

    @Test
    public void lateTeardownDoesNotUndoNextSession() throws Exception {
        AudioSwitchManager manager = new AudioSwitchManager(context);
        manager.start();
        settle(manager);

        // Keep the audio thread busy so the teardown posted by stop() runs late.
        CountDownLatch busy = new CountDownLatch(1);
        CountDownLatch unblock = new CountDownLatch(1);
        handlerOf(manager).post(() -> {
            busy.countDown();
            await(unblock);
        });
        await(busy);
        manager.stop();
        manager.start();
        unblock.countDown();
        settle(manager);
        assertEquals(AudioManager.MODE_IN_COMMUNICATION, audioManager.getMode());

        manager.stop();
        settle(manager);
        assertEquals(AudioManager.MODE_NORMAL, audioManager.getMode());
    }

    @Test
    public void releaseStopsSessionAndThread() throws Exception {
        AudioSwitchManager manager = new AudioSwitchManager(context);
        manager.start();
        settle(manager);
        HandlerThread thread = (HandlerThread) field(manager, "thread");

        manager.release();
        thread.join(TimeUnit.SECONDS.toMillis(5));

        assertFalse(thread.isAlive());
        assertEquals(AudioManager.MODE_NORMAL, audioManager.getMode());
    }

    /**
     * Can block the next switch construction, which looks up the audio service on the
     * audio thread.
     */
    private static class GatedContext extends ContextWrapper {
        private final AtomicBoolean armed = new AtomicBoolean(false);
        final CountDownLatch creating = new CountDownLatch(1);
        final CountDownLatch unblock = new CountDownLatch(1);

        GatedContext(Context base) {
            super(base);
        }

        void blockNextCreation() {
            armed.set(true);
        }

        @Override
        public Object getSystemService(String name) {
            if (Context.AUDIO_SERVICE.equals(name)
                    && Looper.myLooper() != Looper.getMainLooper()
                    && armed.compareAndSet(true, false)) {
                creating.countDown();
                await(unblock);
            }
            return super.getSystemService(name);
        }
    }

    /** Waits until everything queued on the audio thread so far has run. */
    private static void settle(AudioSwitchManager manager) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        handlerOf(manager).post(done::countDown);
        await(done);
    }

    private static void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new AssertionError("Timed out waiting for the audio thread");
            }
        } catch (InterruptedException e) {
            throw new AssertionError(e);
        }
    }

    private static Handler handlerOf(AudioSwitchManager manager) throws Exception {
        return (Handler) field(manager, "handler");
    }

    private static Object field(AudioSwitchManager manager, String name) throws Exception {
        Field f = AudioSwitchManager.class.getDeclaredField(name);
        f.setAccessible(true);
        return f.get(manager);
    }
}
