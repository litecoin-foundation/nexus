package com.litecoin.nexus

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class BiometricEnrollmentPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == BiometricEnrollmentModule.NAME) {
            BiometricEnrollmentModule(reactContext)
        } else {
            null
        }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            BiometricEnrollmentModule.NAME to
                ReactModuleInfo(
                    name = BiometricEnrollmentModule.NAME,
                    className = BiometricEnrollmentModule::class.java.name,
                    canOverrideExistingModule = false,
                    needsEagerInit = false,
                    isCxxModule = false,
                    isTurboModule = false,
                )
        )
    }
}
