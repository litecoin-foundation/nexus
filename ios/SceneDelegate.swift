internal import Expo
import React
import UIKit
import UserNotifications

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private var appDelegate: AppDelegate? {
        UIApplication.shared.delegate as? AppDelegate
    }

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene,
              let appDelegate,
              let factory = appDelegate.reactNativeFactory else { return }

        // Reuse the single app window if UIKit reconnects its scene.
        let window = appDelegate.window ?? UIWindow(windowScene: windowScene)
        window.windowScene = windowScene
        self.window = window
        // Older React Native and Expo modules still look up the app delegate's window.
        appDelegate.window = window

        let isReactNativeRunning = window.rootViewController != nil
        if !isReactNativeRunning {
            var launchOptions = appDelegate.reactNativeLaunchOptions ?? [:]
            // Scene-based launches deliver deep links here, rather than in didFinishLaunching.
            if let context = connectionOptions.urlContexts.first {
                launchOptions[.url] = context.url
                launchOptions[.sourceApplication] = context.options.sourceApplication
                launchOptions[.annotation] = context.options.annotation
            }
            if let activity = connectionOptions.userActivities.first(where: {
                $0.activityType == NSUserActivityTypeBrowsingWeb
            }) ?? connectionOptions.userActivities.first {
                launchOptions[.userActivityDictionary] = [
                    UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
                    "UIApplicationLaunchOptionsUserActivityKey": activity
                ]
            }
            if let response = connectionOptions.notificationResponse,
               response.notification.request.trigger is UNPushNotificationTrigger {
                launchOptions[.remoteNotification] = response.notification.request.content.userInfo
            }

            factory.startReactNative(withModuleName: "nexus", in: window, launchOptions: launchOptions)
            appDelegate.reactNativeLaunchOptions = nil
        } else {
            window.makeKeyAndVisible()
        }

        // On first launch React Native reads these from launchOptions; avoid duplicate URL events.
        for context in connectionOptions.urlContexts {
            open(context, notifyReactNative: isReactNativeRunning)
        }
        for activity in connectionOptions.userActivities {
            continueActivity(activity, notifyReactNative: isReactNativeRunning)
        }
    }

    // Expo 55 receives these events through its app delegate subscribers.
    func sceneDidBecomeActive(_ scene: UIScene) {
        appDelegate?.applicationDidBecomeActive(UIApplication.shared)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        appDelegate?.applicationWillResignActive(UIApplication.shared)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        appDelegate?.applicationWillEnterForeground(UIApplication.shared)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        appDelegate?.applicationDidEnterBackground(UIApplication.shared)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            open(context, notifyReactNative: true)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        continueActivity(userActivity, notifyReactNative: true)
    }

    private func open(_ context: UIOpenURLContext, notifyReactNative: Bool) {
        var options: [UIApplication.OpenURLOptionsKey: Any] = [
            .openInPlace: context.options.openInPlace
        ]
        options[.sourceApplication] = context.options.sourceApplication
        options[.annotation] = context.options.annotation
        _ = appDelegate?.application(UIApplication.shared, open: context.url, options: options)
        if notifyReactNative {
            _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: options)
        }
    }

    private func continueActivity(_ activity: NSUserActivity, notifyReactNative: Bool) {
        _ = appDelegate?.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        if notifyReactNative {
            _ = RCTLinkingManager.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        }
    }
}
