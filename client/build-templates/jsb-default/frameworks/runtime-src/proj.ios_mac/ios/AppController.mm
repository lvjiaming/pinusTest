/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#import "AppController.h"
#import "cocos2d.h"
#import "AppDelegate.h"
#import "RootViewController.h"
#import "SDKWrapper.h"
#import "platform/ios/CCEAGLView-ios.h"
#import <AVFoundation/AVFoundation.h>
#import <UMSocialCore/UMSocialCore.h>
#import "WXApi.h"
#import "UMSocialWechatHandler.h"
#import <AMapFoundationKit/AMapFoundationKit.h>
#import <AMapLocationKit/AMapLocationKit.h>
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#import <Foundation/Foundation.h>
#import "Reachability.h"
#import "zhuanHuanM4a.h"
using namespace cocos2d;

@implementation AppController

Application* app = nullptr;
@synthesize window;

#pragma mark -
#pragma mark Application lifecycle

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [[SDKWrapper getInstance] application:application didFinishLaunchingWithOptions:launchOptions];
    // Add the view controller's view to the window and display.
    float scale = [[UIScreen mainScreen] scale];
    CGRect bounds = [[UIScreen mainScreen] bounds];
    window = [[UIWindow alloc] initWithFrame: bounds];
    
    // cocos2d application instance
    app = new AppDelegate(bounds.size.width * scale, bounds.size.height * scale);
    app->setMultitouch(true);
    
    // Use RootViewController to manage CCEAGLView
    _viewController = [[RootViewController alloc]init];
#ifdef NSFoundationVersionNumber_iOS_7_0
    _viewController.automaticallyAdjustsScrollViewInsets = NO;
    _viewController.extendedLayoutIncludesOpaqueBars = NO;
    _viewController.edgesForExtendedLayout = UIRectEdgeAll;
#else
    _viewController.wantsFullScreenLayout = YES;
#endif
    // Set RootViewController to window
    if ( [[UIDevice currentDevice].systemVersion floatValue] < 6.0)
    {
        // warning: addSubView doesn't work on iOS6
        [window addSubview: _viewController.view];
    }
    else
    {
        // use this method on ios6
        [window setRootViewController:_viewController];
    }
    
    [window makeKeyAndVisible];
    
    [[UIApplication sharedApplication] setStatusBarHidden:YES];
    [[NSNotificationCenter defaultCenter] addObserver:self
        selector:@selector(statusBarOrientationChanged:)
        name:UIApplicationDidChangeStatusBarOrientationNotification object:nil];
    
    //run the cocos2d-x game scene
    app->start();
    
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    //高德key  3c00b78bc31692128e91ff9aae3199dc
        
    
    
    
    return YES;
}

+(void)initSDK:(NSString *)weiXinID weiXinSecret:(NSString *)weiXinSecret umKey:(NSString *)umKey amapKey:(NSString *)amapKey{
    
    // 设置appkey是在基础包中
    [AMapServices sharedServices].apiKey = amapKey;
        
    //友盟
    [[UMSocialManager defaultManager] setUmSocialAppkey:umKey];
    /* 设置微信的appKey和appSecret */
    [[UMSocialManager defaultManager] setPlaform:UMSocialPlatformType_WechatSession appKey:weiXinID appSecret:weiXinSecret redirectURL:@"http://mobile.umeng.com/social"];
    
}
#pragma mark - ----------------- 电池 --------------------

+(NSNumber *)getBattery{
    
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    double deviceLevel = [UIDevice currentDevice].batteryLevel;
    NSString *str = [NSString stringWithFormat:@"%.2f", deviceLevel];
//    NSLog(@"+++++++++++++++++++++++%@", str);
    return @([str floatValue]);

}
#pragma mark - ----------------- 定位 --------------------
+(void)getGPSInfo{
    
    NSLog(@"123123123");

    AMapLocationManager *locationManager = [[AMapLocationManager alloc] init];
    
    [locationManager setDelegate:self];
    
    [locationManager setDesiredAccuracy:kCLLocationAccuracyHundredMeters];
    
    [locationManager setLocationTimeout:6];
    
    [locationManager setReGeocodeTimeout:3];
    
    
    //带逆地理的单次定位
    [locationManager requestLocationWithReGeocode:YES completionBlock:^(CLLocation *location, AMapLocationReGeocode *regeocode, NSError *error) {
        
        if (error)
        {
            NSLog(@"locError:{%ld - %@};", (long)error.code, error.localizedDescription);
            
            if (error.code == AMapLocationErrorLocateFailed)
            {
                

                return;
            }
        }
        CLLocationDegrees latitude = location.coordinate.latitude;
        CLLocationDegrees longitude = location.coordinate.longitude;
        
        //定位信息
        NSLog(@"location:%f   %f", latitude,longitude);
        
        //逆地理信息
        if (regeocode)
        {
            NSLog(@"reGeocode:%@", regeocode.formattedAddress);
        }
        
        
        NSString *str = [NSString stringWithFormat:@"{\"berror\":\"false\",\"longitude\":\"%f\",\"latitude\":\"%f\",\"code\":\"0\",\"address\":\"%@\",\"msg\":\"success\"}",longitude,latitude,regeocode.formattedAddress];
 
        
        NSLog(@"%@", str);

        std::string strRet1 = [str UTF8String];
        
        std::string strRet = "onUpdateGPS";
        
        NSLog(@"QQQQQQQQQ:::::%s",strRet1.c_str());
        std::string jsCallStr = cocos2d::StringUtils::format("native2Cocos(\"%s\",'%s');", strRet.c_str(),strRet1.c_str());
        
        NSLog(@"~~~~~~~~~~~~~%s",jsCallStr.c_str());
        
        se::Value *ret = new se::Value();
        se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
        
    }];
    
}

#pragma mark - ----------------- 微信登录 --------------------
+ (void)WXLogin{
    
    [[UMSocialManager defaultManager] getUserInfoWithPlatform:UMSocialPlatformType_WechatSession currentViewController:nil completion:^(id result, NSError *error) {
        if (error) {
            
        } else {
            UMSocialUserInfoResponse *resp = result;
            
            // 授权信息
            NSLog(@"Wechat uid: %@", resp.uid);
            NSLog(@"Wechat openid: %@", resp.openid);
            NSLog(@"Wechat accessToken: %@", resp.accessToken);
            NSLog(@"Wechat refreshToken: %@", resp.refreshToken);
            NSLog(@"Wechat expiration: %@", resp.expiration);
            
            // 用户信息
            NSLog(@"Wechat name: %@", resp.name);
            NSLog(@"Wechat iconurl: %@", resp.iconurl);
            NSLog(@"Wechat gender: %@", resp.unionGender);
            
            // 第三方平台SDK源数据
            NSLog(@"Wechat originalResponse: %@", resp.originalResponse);
            //            NSString *sex=[NSString stringWithFormat:@"%ld", [[resp.originalResponse objectForKey:@"sex"] integerValue]];

            NSMutableDictionary *dic = [NSMutableDictionary dictionary];
            [dic setValue:resp.openid forKey:@"openid"];
            [dic setValue:resp.name forKey:@"nickname"];
            [dic setValue:resp.unionGender forKey:@"sex"];
            [dic setValue:resp.iconurl forKey:@"headimgurl"];
            //保存openid
            [[NSUserDefaults standardUserDefaults]setObject:resp.openid forKey:@"openid"];
            
            NSError *error;
            NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dic options:NSJSONWritingPrettyPrinted error:&error];
            NSString *jsonString;
            if (!jsonData) {
                NSLog(@"%@",error);
            }else{
                jsonString = [[NSString alloc]initWithData:jsonData encoding:NSUTF8StringEncoding];
            }
            NSMutableString *mutStr = [NSMutableString stringWithString:jsonString];

            
            NSLog(@"%@", mutStr);
      
            
            NSString *str = [NSString stringWithFormat:@"{\"headimgurl\":\"%@\",\"sex\":\"%@\",\"openid\":\"%@\"}",resp.iconurl,resp.unionGender,resp.openid];
            
            
            NSLog(@"%@", str);
 
            std::string strRet1 = [str UTF8String];
            
            std::string strRet = "onWXCode";
            
            
            
            
            NSData *data = [resp.name dataUsingEncoding:NSUTF8StringEncoding];
            //NSString *stringBase64 = [data base64Encoding]; // base64格式的字符串(不建议使用,用下面方法替代)
            NSString *stringBase64 = [data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed]; // base64格式的字符串
            std::string name = [stringBase64 UTF8String];
            
            NSLog(@"QQQQQQQQQ:::::%s",strRet1.c_str());
            std::string jsCallStr = cocos2d::StringUtils::format("native2Cocos(\"%s\",'%s',\"%s\");", strRet.c_str(),strRet1.c_str(),name.c_str());

            NSLog(@"~~~~~~~~~~~~~%s",jsCallStr.c_str());
            se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str());
//            se::Value *ret = new se::Value();
//            se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
            // NSLog(@"jsCallStr rtn = %s", ret->toString().c_str());
 
        }
    }];
    
}


#pragma mark - ----------------- 微信分享图片 --------------------
+(void)WXShareTex:(NSString*)content_link IsTimeLine:(NSNumber *)IsTimeLine{
    
    if (IsTimeLine.intValue == 1) {
        //1.创建多媒体消息结构体
        WXMediaMessage *mediaMsg = [WXMediaMessage message];
        //2.创建多媒体消息中包含的图片数据对象
        WXImageObject *imgObj = [WXImageObject object];
        //图片真实数据
        
        NSString *imageString = content_link;
        
        if([content_link hasPrefix:@"http"])
        {//判断字符串是否以B字符开始
            NSLog(@"开头为字母B");
            //1.创建多媒体消息结构体
            WXMediaMessage *mediaMsg = [WXMediaMessage message];
            //2.创建多媒体消息中包含的图片数据对象
            WXImageObject *imgObj = [WXImageObject object];
            //图片真实数据
            NSURL *url=[NSURL URLWithString:content_link];
            imgObj.imageData = [NSData dataWithContentsOfURL:url];
            //多媒体数据对象
            mediaMsg.mediaObject = imgObj;
            
            //3.创建发送消息至微信终端程序的消息结构体
            SendMessageToWXReq *req = [[SendMessageToWXReq alloc] init];
            //多媒体消息的内容
            req.message = mediaMsg;
            //指定为发送多媒体消息（不能同时发送文本和多媒体消息，两者只能选其一）
            req.bText = NO;
            //指定发送到会话(聊天界面)
            req.scene = WXSceneTimeline;
            
//            std::string strRet1 = "1";
//            std::string strRet = "CheckShareFunc";
//
//            std::string jsCallStr = cocos2d::StringUtils::format("CallLobbyFunc(\"%s\");", strRet.c_str());
//
//            NSLog(@"~~~~~~~~~~~~~%s",jsCallStr.c_str());
//
//            se::Value *ret = new se::Value();
//            se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
            
            
            
            //发送请求到微信,等待微信返回onResp
            [WXApi sendReq:req];

        }else{
            NSLog(@"开头不为字母B");
            
            UIImage *imgFromUrl3=[[UIImage alloc]initWithContentsOfFile:imageString];
            
            NSData *imageData = UIImageJPEGRepresentation(imgFromUrl3, 0.5);
            
            //        NSURL *url=[NSURL URLWithString:param.sMedia];
            imgObj.imageData = imageData;
            //多媒体数据对象
            mediaMsg.mediaObject = imgObj;
            
            //        [mediaMsg setThumbImage:[self getShareImage:param]];
            //3.创建发送消息至微信终端程序的消息结构体
            SendMessageToWXReq *req = [[SendMessageToWXReq alloc] init];
            //多媒体消息的内容
            req.message = mediaMsg;
            //指定为发送多媒体消息（不能同时发送文本和多媒体消息，两者只能选其一）
            req.bText = NO;
            //指定发送到会话(聊天界面)
            req.scene = WXSceneTimeline;
            [WXApi sendReq:req];
   
        }

    }else{
        //1.创建多媒体消息结构体
        WXMediaMessage *mediaMsg = [WXMediaMessage message];
        //2.创建多媒体消息中包含的图片数据对象
        WXImageObject *imgObj = [WXImageObject object];
        //图片真实数据
        
        if([content_link hasPrefix:@"http"])
        {
            WXMediaMessage *mediaMsg = [WXMediaMessage message];
            //2.创建多媒体消息中包含的图片数据对象
            WXImageObject *imgObj = [WXImageObject object];
            //图片真实数据
            NSURL *url=[NSURL URLWithString:content_link];
            imgObj.imageData = [NSData dataWithContentsOfURL:url];
            //多媒体数据对象
            mediaMsg.mediaObject = imgObj;
            //3.创建发送消息至微信终端程序的消息结构体
            SendMessageToWXReq *req = [[SendMessageToWXReq alloc] init];
            //多媒体消息的内容
            req.message = mediaMsg;
            //指定为发送多媒体消息（不能同时发送文本和多媒体消息，两者只能选其一）
            req.bText = NO;
            //指定发送到会话(聊天界面)
            
            req.scene = WXSceneSession;
            [WXApi sendReq:req];
            
        }else{
            NSString *imageString = content_link;
            
            UIImage *imgFromUrl3=[[UIImage alloc]initWithContentsOfFile:imageString];
            
            NSData *imageData = UIImageJPEGRepresentation(imgFromUrl3, 0.5);
            
            //        NSURL *url=[NSURL URLWithString:param.sMedia];
            imgObj.imageData = imageData;
            //多媒体数据对象
            mediaMsg.mediaObject = imgObj;
            SendMessageToWXReq *req = [[SendMessageToWXReq alloc] init];
            //多媒体消息的内容
            req.message = mediaMsg;
            //指定为发送多媒体消息（不能同时发送文本和多媒体消息，两者只能选其一）
            req.bText = NO;
            //指定发送到会话(聊天界面)
            
            req.scene = WXSceneSession;
            [WXApi sendReq:req];
            
        }
        
        
        //        [mediaMsg setThumbImage:[self getShareImage:param]];
        
        
    }
    
}
#pragma mark - ----------------- 微信分享消息链接 --------------------
+(void)WXSharetitle:(NSString *)title description:(NSString *)description url:(NSString *)url IsTimeLine:(NSNumber*)IsTimeLine{
    
    SendMessageToWXReq *req = [[SendMessageToWXReq alloc] init];
    WXMediaMessage *message = [WXMediaMessage message];
    message.title = title;
    message.description = description;
    [message setThumbImage:[UIImage imageNamed:@"icon-40"]];
    req.message = message;
    //    WXAppExtendObject *ext = [WXAppExtendObject object];
    //    ext.url = url;
    //    ext.extInfo = @"房号";
    //    message.mediaObject = ext;
    
    WXWebpageObject * object = [[WXWebpageObject alloc] init];
    object.webpageUrl = url;
    
    message.mediaObject = object;
    
    
    if (IsTimeLine.intValue == 1) {
        //默认是Session分享给朋友,Timeline是朋友圈,Favorite是收藏
        req.scene = WXSceneTimeline;
    }else{
        req.scene = WXSceneSession;
        
    }
    [WXApi sendReq:req];
    
}

////////////////
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
    BOOL result = [[UMSocialManager defaultManager] handleOpenURL:url];
    if (result)
    {//友盟分享配置
        return result;
    }else
    {//支付宝和微信配置
        
        return [WXApi handleOpenURL:url delegate:self];
        
    }
    
}
-(BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
    
    BOOL result = [[UMSocialManager defaultManager] handleOpenURL:url];
    //    DLog(@"url = %@ \n options = %@",url,options);
    if ([url.host isEqualToString:@"safepay"]) {
        //跳转支付宝钱包进行支付，处理支付结果

        return YES;
    }else if ([options[UIApplicationOpenURLOptionsSourceApplicationKey] isEqualToString:@"com.tencent.xin"] && [url.absoluteString containsString:@"pay"]) {
        return [WXApi handleOpenURL:url delegate:self];
        
    }else{
        
        std::string strRet1 = "1";
        std::string strRet = "CheckShareFunc";

        std::string jsCallStr = cocos2d::StringUtils::format("CallLobbyFunc(\"%s\",'%s');", strRet.c_str(),strRet1.c_str());

        NSLog(@"~~~~~~~~~~~~~%s",jsCallStr.c_str());

        se::Value *ret = new se::Value();
        se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
        
        return [WXApi handleOpenURL:url delegate:self];
    }
    

    return YES;
}

#pragma mark - ----------------- 复制剪切板 --------------------
+(void)CopyClipper:(NSString *)str{
    
    NSLog(@"执行了点击事件");
    //msg
    
    UIPasteboard *board = [UIPasteboard generalPasteboard];
    board.string = str;
    NSLog(@"~~~~~~~~~~~%@", board.string);
    
    UIAlertView *alert = [[UIAlertView alloc]initWithTitle:@"" message:@"复制成功"
                                                  delegate:nil cancelButtonTitle:@"确定" otherButtonTitles: nil];
    [alert show];
    

}
#pragma mark - ----------------- 打开url --------------------
+(void)OpenUrl:(NSString *)str{
    
    
    NSURL *cleanURL = [NSURL URLWithString:[NSString stringWithFormat:@"%@", str]];
    [[UIApplication sharedApplication] openURL:cleanURL];
    
 
}

+ (NSString *)isWifi {
    
    Reachability *reachability   = [Reachability reachabilityWithHostName:@"www.apple.com"];
    NetworkStatus internetStatus = [reachability currentReachabilityStatus];
    NSString *net = @"WIFI";
    switch (internetStatus) {
        case ReachableViaWiFi:
            net = @"WIFI";
            return @"1";
            break;
            
        case ReachableViaWWAN:
            net = @"蜂窝数据";
            //net = [self getNetType ];   //判断具体类型
             return @"0";
            break;
            
        case NotReachable:
            net = @"当前无网路连接";
            return @"0";
        default:
            break;
    }
    return nil;
 
    
}

#pragma mark------------y录音
+(void)startRecord{
    [[[self alloc] init] startVideo];
    
}
- (void)startVideo{
     NSString *path = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"text.caf"];
            // url : 录音文件的路径 (这里为便于测试，我用桌面路径,项目中需要用沙盒路径)
            NSURL *url = [NSURL URLWithString:path];
            // setting:录音的设置项
            NSDictionary *configDic = @{// 编码格式
                                        AVFormatIDKey:@(kAudioFormatLinearPCM),
                                        // 采样率
                                        AVSampleRateKey:@(8000),
                                        // 通道数
                                        AVNumberOfChannelsKey:@(1),
                                        // 录音质量
                                        AVEncoderAudioQualityKey:@(AVAudioQualityMin)
                                        };
            NSError *error = nil;
            [[AVAudioSession sharedInstance]
    //        在创建recorder之前加上这两行,可以解决播放无声音的问题

            setCategory:@"AVAudioSessionCategoryPlayAndRecord" error:nil];
            [[AVAudioSession sharedInstance] overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:nil];
            _record = [[AVAudioRecorder alloc]initWithURL:url settings:configDic error:&error];
            if (error) {
                NSLog(@"error:%@",error);
            }
            // 准备录音(系统会给我们分配一些资源)
            [_record prepareToRecord];
    [self.record record];
    NSLog(@"开始录音");



    
}
+(NSString*)stopRecord{
  
    NSString *str = [[[self alloc] init] stopVideo];
    NSLog(@"qqqqqqqqqqqqqqqqqqqq%@",str);
    return str;
    
}
- (NSString *)stopVideo{
    if (self.record.currentTime > 2) {
        [self.record stop];
    } else {
        // 删除录音文件
        //如果想要删除录音文件，必须先停止录音
        [self.record stop];
        [self.record deleteRecording];
    }
    NSLog(@"结束录音");

     NSString *pathuLu = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"text.caf"];
    
    NSString *path1 = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"aaaa.m4a"];

    [zhuanHuanM4a convetCafToM4a:pathuLu destUrl:path1 completed:^(NSError * _Nonnull error) {

         NSData *mp3Data = [NSData dataWithContentsOfFile:path1];

         NSString *data = [mp3Data base64Encoding];
        
        std::string strRet1 = [data UTF8String];
        
        
        std::string strRet = "onRecordFinish";
        

        std::string jsCallStr = cocos2d::StringUtils::format("native2Cocos(\"%s\",'%s');", strRet.c_str(),strRet1.c_str());
        
        se::Value *ret = new se::Value();
        se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
        
        NSString *path = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"aaaa.m4a"];

           NSFileManager*fileManager = [NSFileManager defaultManager];

           [fileManager removeItemAtPath:path error:nil];

    }];
    
   
    
        
    return @"wait";
}
- (CGFloat)fileSize:(NSURL *)path
{
    return [[NSData dataWithContentsOfURL:path] length]/1024.00 /1024.00;
}
+(void)playVoice:(NSString *)str{


    [[[self alloc] init] playVoiceData:str];
    
}
- (void)playVoiceData:(NSString *)data{
    
    // Base64形式的字符串为data
    NSData *videoMy = [[NSData alloc] initWithBase64EncodedString:data options:NSDataBase64DecodingIgnoreUnknownCharacters];
    
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    //默认情况下扬声器播放
    [audioSession setCategory:AVAudioSessionCategoryPlayback error:nil];
    [audioSession setActive:YES error:nil];
    
     
    
    self.player = [[AVAudioPlayer alloc] initWithData:videoMy error:nil];
    self.player.numberOfLoops = 0;
    self.player.delegate = self;
    CGFloat currentVol = audioSession.outputVolume;
    //设置播放器声音
    
    self.player.volume = currentVol;
    [self.player play];
}
- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag
{
   std::string strRet = "onPlayFinish";
   

   std::string jsCallStr = cocos2d::StringUtils::format("native2Cocos(\"%s\");", strRet.c_str());
   
   se::Value *ret = new se::Value();
   se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
}
#pragma mark - ------------------------ 微信支付 ---------------------

+ (void)WXPay:(NSString *)urlString{
//    [WXApi registerApp:@"wxd28f691e7b5ed394" enableMTA:YES];
    //============================================================
    // V3&V4支付流程实现
    // 注意:参数配置请查看服务器端Demo
    // 更新时间：2015年11月20日
    //============================================================
//    NSString *urlString   = @"https://wxpay.wxutil.com/pub_v2/app/app_pay.php?plat=ios";
    //解析服务端返回json数据
    NSError *error;
    //加载一个NSURL对象
//    NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:urlString]];
//    //将请求的url数据放到NSData对象中
//    NSData *response = [NSURLConnection sendSynchronousRequest:request returningResponse:nil error:nil];
    
    NSData *jsonData = [urlString dataUsingEncoding:NSUTF8StringEncoding];
    
    if ( jsonData != nil) {
        NSMutableDictionary *dict = NULL;
        //IOS5自带解析类NSJSONSerialization从response中解析出数据放到字典中
        dict = [NSJSONSerialization JSONObjectWithData:jsonData options:NSJSONReadingMutableLeaves error:&error];
        
        NSLog(@"url:%@",urlString);
        if(dict != nil){
            NSMutableString *retcode = [dict objectForKey:@"retcode"];
            if (retcode.intValue == 0){
                NSMutableString *stamp  = [dict objectForKey:@"timestamp"];
                
                //调起微信支付
                PayReq* req             = [[PayReq alloc] init];
//                req.openID              = [dict objectForKey:@"appid"];
                req.partnerId           = [dict objectForKey:@"partnerid"];
                req.prepayId            = [dict objectForKey:@"prepayid"];
                req.nonceStr            = [dict objectForKey:@"noncestr"];
                req.timeStamp           = stamp.intValue;
                req.package             = [dict objectForKey:@"package"];
                req.sign                = [dict objectForKey:@"sign"];
                [WXApi sendReq:req];
                //日志输出
                NSLog(@"appid=%@\npartid=%@\nprepayid=%@\nnoncestr=%@\ntimestamp=%ld\npackage=%@\nsign=%@",[dict objectForKey:@"appid"],req.partnerId,req.prepayId,req.nonceStr,(long)req.timeStamp,req.package,req.sign );
//                return @"";
            }else{
//                return [dict objectForKey:@"retmsg"];
            }
        }else{
//            return @"服务器返回错误，未获取到json对象";
        }
    }else{
//        return @"服务器返回错误";
    }
}

#pragma mark - WXApiDelegate
- (void)onResp:(BaseResp *)resp {
    
//    // 1.分享后回调类
    if ([resp isKindOfClass:[SendMessageToWXResp class]]) {
        
//        std::string strRet1 = "1";
//        std::string strRet = "CheckShareFunc";
//
//        std::string jsCallStr = cocos2d::StringUtils::format("CallLobbyFunc(\"%s\",'%s');", strRet.c_str(),strRet1.c_str());
//
//        NSLog(@"~~~~~~~~~~~~~%s",jsCallStr.c_str());
//
//        se::Value *ret = new se::Value();
//        se::ScriptEngine::getInstance()->evalString(jsCallStr.c_str() , -1 , ret);
        
//        SendMessageToWXResp *sendResp = (SendMessageToWXResp *)resp;
//        NSString *strMsg1,*strTitle1 = [NSString stringWithFormat:@"分享结果"];
//        if (sendResp.errCode == 0) {
//
//            strMsg1 = @"分享成功";
//        }else{
//            strMsg1 = @"分享失败";
//
//        }
//
//        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:strTitle1 message:strMsg1 delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
//        [alert show];
//        return;
    }

    
    if([resp isKindOfClass:[PayResp class]]){
        //支付返回结果，实际支付结果需要去微信服务器端查询
        NSString *strMsg,*strTitle = [NSString stringWithFormat:@"支付结果"];

        switch (resp.errCode) {
            case WXSuccess:
                strMsg = @"支付结果：成功！";
                NSLog(@"支付成功－PaySuccess，retcode = %d", resp.errCode);
                break;

            default:
//                strMsg = [NSString stringWithFormat:@"支付结果：失败！retcode = %d, retstr = %@", resp.errCode,resp.errStr];
                strMsg = @"支付结果：失败";

                NSLog(@"错误，retcode = %d, retstr = %@", resp.errCode,resp.errStr);
                break;
        }
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:strTitle message:strMsg delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
        [alert show];
    }else {
        
        
    }
}


- (void)statusBarOrientationChanged:(NSNotification *)notification {
    CGRect bounds = [UIScreen mainScreen].bounds;
    float scale = [[UIScreen mainScreen] scale];
    float width = bounds.size.width * scale;
    float height = bounds.size.height * scale;
    Application::getInstance()->updateViewSize(width, height);
}

- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    app->onPause();
    [[SDKWrapper getInstance] applicationWillResignActive:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    app->onResume();
    [[SDKWrapper getInstance] applicationDidBecomeActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    [[SDKWrapper getInstance] applicationDidEnterBackground:application]; 
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    [[SDKWrapper getInstance] applicationWillEnterForeground:application]; 
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    [[SDKWrapper getInstance] applicationWillTerminate:application];
    delete app;
    app = nil;
}
- (void)configUI{
    UIAlertView *alert = [[UIAlertView alloc]initWithTitle:@"提示" message:@"" delegate:self cancelButtonTitle:@"cancel" otherButtonTitles:@"Exit", nil];
    [alert show];
}
- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex{
    NSLog(@"%ld",buttonIndex);
    if (buttonIndex == 1) {
        [self GameClose];
    }
}
+(void)GameClose{//退出App
    UIWindow *window = [UIApplication sharedApplication].delegate.window;//获得窗口
    [UIView animateWithDuration:1.0f animations:^{
        window.alpha = 0;
        window.frame = CGRectMake(window.bounds.size.height/2, window.bounds.size.width, 0, 0);
    } completion:^(BOOL finished) {
        exit(0);//动画完毕退出App
    }];
}

#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    /*
     Free up as much memory as possible by purging cached data objects that can be recreated (or reloaded from disk) later.
     */
}

@end
