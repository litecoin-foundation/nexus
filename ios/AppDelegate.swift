internal import Expo
import React
import ReactAppDependencyProvider
import UIKit
import UserNotifications
import RNBootSplash

@main
class AppDelegate: ExpoAppDelegate, UNUserNotificationCenterDelegate {
    var window: UIWindow?

    var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    public override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let delegate = ReactNativeDelegate()
        let factory = ExpoReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        window = UIWindow(frame: UIScreen.main.bounds)

        factory.startReactNative(
            withModuleName: "nexus",
            in: window,
            launchOptions: launchOptions
        )

        // Request notification permission
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
        if granted {
            DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
            }
        } else {
            print("Notification permission not granted:", error?.localizedDescription ?? "unknown error")
        }
        }

        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    // Called when APNs has assigned the device a token
    override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()

        // Update the token and notify React Native
        APNSTokenModule.updateToken(token)
    }

    // Called if registration for remote notifications failed
    override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for APNs: \(error.localizedDescription)")
    }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        bridge.bundleURL ?? bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
            RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
            Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

    override func customize(_ rootView: RCTRootView) {
        super.customize(rootView)
        RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView) // ⬅️ initialize the splash screen
    }
}

