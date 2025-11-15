package com.litecoin.nexus

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

class MainApplication : Application(), ReactApplication {

    override val reactHost: ReactHost by lazy {
        ExpoReactHostFactory.getDefaultReactHost(
                context = applicationContext,
                packageList =
                        PackageList(this).packages.apply {
                            // Packages that cannot be autolinked yet can be added manually here,
                            // for example:
                            // add(MyReactNativePackage())
                        }
        )
    }

    override fun onCreate() {
        super.onCreate()
        ReactFontManager.getInstance()
                .addCustomFont(this, "Satoshi Variable", R.font.satoshi_variable)
        DefaultNewArchitectureEntryPoint.releaseLevel =
                try {
                    ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
                } catch (e: IllegalArgumentException) {
                    ReleaseLevel.STABLE
                }
        loadReactNative(this)
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
