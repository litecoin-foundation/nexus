
//
//  Header.h
//  lndmobile
//
//  Created by Loshan T on 24/03/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//  Copyright © 2019 Litecoin Foundation Ltd. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface LndReactModule : RCTEventEmitter <RCTBridgeModule>
@property (nonatomic) NSDictionary *syncMethods;
@property (nonatomic) NSDictionary *streamMethods;
@property (nonatomic) NSMutableDictionary *activeStreams;
@property (nonatomic) NSString *appDir;

@end
