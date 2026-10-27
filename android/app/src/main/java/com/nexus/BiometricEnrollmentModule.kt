package com.litecoin.nexus

import android.content.pm.PackageManager
import android.hardware.fingerprint.FingerprintManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BiometricEnrollmentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = NAME

    @ReactMethod
    fun isFingerprintEnrolled(promise: Promise) {
        try {
            promise.resolve(readFingerprintEnrolled())
        } catch (e: Exception) {
            promise.reject("E_FINGERPRINT_ENROLLMENT", e)
        }
    }

    // NOTE: FingerprintManager is deprecated in favour of BiometricManager, but the
    // latter has no way to ask about a single modality
    @Suppress("DEPRECATION")
    private fun readFingerprintEnrolled(): Boolean {
        val packageManager = reactApplicationContext.packageManager
        if (!packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) {
            return false
        }
        val fingerprintManager =
            reactApplicationContext.getSystemService(FingerprintManager::class.java)
                ?: return false
        return fingerprintManager.isHardwareDetected &&
            fingerprintManager.hasEnrolledFingerprints()
    }

    companion object {
        const val NAME = "BiometricEnrollment"
    }
}
