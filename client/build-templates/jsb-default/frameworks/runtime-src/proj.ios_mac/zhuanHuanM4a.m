//
//  zhuanHuanM4a.m
//  suncity-mobile
//
//  Created by MacBook Pro on 2020/4/1.
//

#import "zhuanHuanM4a.h"
#import <AVFoundation/AVFoundation.h>
@implementation zhuanHuanM4a

/**
 把.caf转为.m4a格式
 @param cafUrlStr .m4a文件路径
 @param m4aUrlStr .caf文件路径
 @param completed 转化完成的block
 */
+ (void)convetCafToM4a:(NSString *)cafUrlStr
               destUrl:(NSString *)m4aUrlStr
             completed:(void (^)(NSError *error)) completed {
    
    AVMutableComposition* mixComposition = [AVMutableComposition composition];
    //  音频插入的开始时间
    CMTime beginTime = kCMTimeZero;
    //  获取音频合并音轨
    AVMutableCompositionTrack *compositionAudioTrack = [mixComposition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];
    //  用于记录错误的对象
    NSError *error = nil;
    //  音频原文件资源
    AVURLAsset *cafAsset = [[AVURLAsset alloc]initWithURL:[NSURL fileURLWithPath:cafUrlStr] options:nil];
    //  原音频需要合并的音频文件的区间
    CMTimeRange audio_timeRange = CMTimeRangeMake(kCMTimeZero, cafAsset.duration);
    BOOL success = [compositionAudioTrack insertTimeRange:audio_timeRange ofTrack:[[cafAsset tracksWithMediaType:AVMediaTypeAudio] objectAtIndex:0] atTime:beginTime error:&error];
    if (!success) {
        NSLog(@"插入原音频失败: %@",error);
    }else {
        NSLog(@"插入原音频成功");
    }
    // 创建一个导入M4A格式的音频的导出对象
    AVAssetExportSession* assetExport = [[AVAssetExportSession alloc] initWithAsset:mixComposition presetName:AVAssetExportPresetAppleM4A];
    // 导入音视频的URL
    assetExport.outputURL = [NSURL fileURLWithPath:m4aUrlStr];
    // 导出音视频的文件格式
    assetExport.outputFileType = @"com.apple.m4a-audio";
    [assetExport exportAsynchronouslyWithCompletionHandler:^{
        // 分发到主线程
        dispatch_async(dispatch_get_main_queue(), ^{
            int exportStatus = assetExport.status;
            if (exportStatus == AVAssetExportSessionStatusCompleted) {
                // 合成成功
                completed(nil);
                NSError *removeError = nil;
                if([cafUrlStr hasSuffix:@"caf"]) {
                    // 删除老录音caf文件
                    if ([[NSFileManager defaultManager] fileExistsAtPath:cafUrlStr]) {
                        BOOL success = [[NSFileManager defaultManager] removeItemAtPath:cafUrlStr error:&removeError];
                        if (!success) {
                            NSLog(@"删除老录音caf文件失败:%@",removeError);
                        }else{
                            NSLog(@"删除老录音caf文件:%@成功",cafUrlStr);
                        }
                    }
                }

                
            }else {
                completed(assetExport.error);
            }
            
        }
        );
    }];
    
    
}


@end
