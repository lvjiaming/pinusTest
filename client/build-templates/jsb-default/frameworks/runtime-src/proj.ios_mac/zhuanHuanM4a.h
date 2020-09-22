//
//  zhuanHuanM4a.h
//  suncity-mobile
//
//  Created by MacBook Pro on 2020/4/1.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface zhuanHuanM4a : NSObject
+ (void)convetCafToM4a:(NSString *)cafUrlStr destUrl:(NSString *)m4aUrlStr
             completed:(void (^)(NSError *error)) completed;


@end

NS_ASSUME_NONNULL_END
