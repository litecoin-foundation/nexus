import Foundation
import React

@objc(APNSTokenModule)
class APNSTokenModule: RCTEventEmitter {

  static var sharedToken: String?
  static var moduleInstance: APNSTokenModule?
  static var pendingToken: String?
  
  override init() {
    super.init()
    APNSTokenModule.moduleInstance = self
  }

  @objc
  func getToken(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if let token = APNSTokenModule.sharedToken {
      resolve(token)
    } else {
      resolve(NSNull())
    }
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["onTokenRefresh"]
  }
  
  override func startObserving() {
    // Bridge is ready, send any pending token
    if let pendingToken = APNSTokenModule.pendingToken {
      APNSTokenModule.pendingToken = nil
      sendEvent(withName: "onTokenRefresh", body: ["token": pendingToken])
    }
  }
  
  @objc
  static func updateToken(_ token: String) {
    let previousToken = sharedToken
    sharedToken = token
    
    // Notify React Native about token change
    if let instance = moduleInstance, previousToken != token {
      instance.sendEvent(withName: "onTokenRefresh", body: ["token": token])
    } else if previousToken != token {
      // Store token to send later when module is initialized
      pendingToken = token
    } else if previousToken == token {
        // Token unchanged, not sending refresh event
    }
  }
}
