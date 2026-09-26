package com.litecoin.nexus

import android.hardware.display.DisplayManager
import android.os.Build
import android.view.Display
import android.view.RoundedCorner
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

// the radius of the display's own rounded corners, in dp, for UI floating near
// the screen's edges to run concentric with them. Only Android 12+ reports it;
// before that, or on a square cornered screen, `radius` is left out
class ScreenCornerRadiusModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    override fun getConstants(): Map<String, Any> =
        readRadius()?.let { mapOf("radius" to it) } ?: emptyMap()

    private fun readRadius(): Double? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return null
        }
        val display =
            reactApplicationContext
                .getSystemService(DisplayManager::class.java)
                ?.getDisplay(Display.DEFAULT_DISPLAY) ?: return null
        // the bottom corners, as that's where the floating cards sit
        val corner =
            display.getRoundedCorner(RoundedCorner.POSITION_BOTTOM_LEFT) ?: return null
        val density = reactApplicationContext.resources.displayMetrics.density
        return (corner.radius / density).toDouble()
    }

    companion object {
        const val NAME = "ScreenCornerRadius"
    }
}
