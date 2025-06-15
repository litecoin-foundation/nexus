#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(APNSTokenModule, NSObject)

RCT_EXTERN_METHOD(getToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end