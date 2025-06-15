import Foundation
import React

@objc(APNSTokenModule)
class APNSTokenModule: NSObject {

  static var sharedToken: String?

  @objc
  func getToken(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if let token = APNSTokenModule.sharedToken {
      resolve(token)
    } else {
      resolve(NSNull())
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
