package com.livekit.reactnative

import android.content.BroadcastReceiver
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.os.Build
import android.os.PowerManager
import androidx.annotation.RequiresApi

/**
 * Thermal state, power save mode and memory pressure: the three signals SPEC's cadence policy needs
 * and no browser can answer. The pipeline never measures any of them itself — measuring CPU costs
 * CPU — so each value here is the OS's own judgement, reported when it changes.
 *
 * Values are SPEC's names, not Android's, so that a record from Android and a record from iOS say
 * the same thing.
 */
class DeviceStateMonitor(
    private val context: Context,
    private val onChange: (Map<String, Any>) -> Unit,
) {
    companion object {
        const val EVENT_NAME = "LK_DEVICE_STATE"

        /** `PowerManager.THERMAL_STATUS_*` collapsed onto SPEC's four levels. */
        fun thermalName(status: Int): String = when (status) {
            PowerManager.THERMAL_STATUS_NONE -> "nominal"
            PowerManager.THERMAL_STATUS_LIGHT -> "fair"
            PowerManager.THERMAL_STATUS_MODERATE, PowerManager.THERMAL_STATUS_SEVERE -> "serious"
            else -> "critical"
        }

        /** `onTrimMemory` levels, as SPEC maps them. */
        fun memoryName(level: Int): String = when {
            level >= ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> "critical"
            level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL -> "critical"
            level >= ComponentCallbacks2.TRIM_MEMORY_BACKGROUND -> "warning"
            level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW -> "warning"
            else -> "normal"
        }
    }

    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager

    @RequiresApi(Build.VERSION_CODES.Q)
    private val thermalListener = PowerManager.OnThermalStatusChangedListener { status ->
        onChange(mapOf("thermal" to thermalName(status)))
    }

    private val powerSaveReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            onChange(mapOf("lowPower" to powerManager.isPowerSaveMode))
        }
    }

    private val memoryCallbacks = object : ComponentCallbacks2 {
        override fun onTrimMemory(level: Int) = onChange(mapOf("memory" to memoryName(level)))
        override fun onConfigurationChanged(newConfig: Configuration) = Unit

        @Deprecated("Required by ComponentCallbacks2 below API 34")
        override fun onLowMemory() = onChange(mapOf("memory" to "critical"))
    }

    private var started = false

    fun start() {
        if (started) return
        started = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            powerManager.addThermalStatusListener(thermalListener)
        }
        context.registerReceiver(
            powerSaveReceiver,
            IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED),
        )
        context.applicationContext.registerComponentCallbacks(memoryCallbacks)
    }

    fun stop() {
        if (!started) return
        started = false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            powerManager.removeThermalStatusListener(thermalListener)
        }
        runCatching { context.unregisterReceiver(powerSaveReceiver) }
        context.applicationContext.unregisterComponentCallbacks(memoryCallbacks)
    }

    /** Everything that is a state rather than an edge, for the first report. */
    fun snapshot(): Map<String, Any> = buildMap {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            put("thermal", thermalName(powerManager.currentThermalStatus))
        }
        put("lowPower", powerManager.isPowerSaveMode)
    }
}
