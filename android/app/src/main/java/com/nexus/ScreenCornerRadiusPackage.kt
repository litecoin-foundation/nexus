package com.litecoin.nexus

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class ScreenCornerRadiusPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        if (name == ScreenCornerRadiusModule.NAME) {
            ScreenCornerRadiusModule(reactContext)
        } else {
            null
        }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            ScreenCornerRadiusModule.NAME to
                ReactModuleInfo(
                    name = ScreenCornerRadiusModule.NAME,
                    className = ScreenCornerRadiusModule::class.java.name,
                    canOverrideExistingModule = false,
                    needsEagerInit = false,
                    isCxxModule = false,
                    isTurboModule = false,
                )
        )
    }
}
