/****************************************************************************
 Copyright (c) 2015-2016 Chukong Technologies Inc.
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
package org.cocos2dx.javascript;

import org.cocos2dx.lib.Cocos2dxActivity;
import org.cocos2dx.lib.Cocos2dxGLSurfaceView;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
import org.json.JSONException;
import org.json.JSONObject;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Bundle;

import android.content.Intent;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.view.KeyEvent;
import android.widget.Toast;

import com.umeng.message.PushAgent;
import com.umeng.socialize.UMAuthListener;
import com.umeng.socialize.UMShareAPI;
import com.umeng.socialize.UMShareListener;
import com.umeng.socialize.bean.SHARE_MEDIA;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AppActivity extends Cocos2dxActivity {

    public static Context sContext;
    public static AppActivity app;

    private static ExitGameTip mCocos2dxExitGame;
    private static final String TAG = "jswrapper";
    public static BatteryChangedReceiver batteryChangedReceiver;
    public static float mBatLv = 1;

    public static String[] needPermissions = {
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.READ_PHONE_STATE
    };

    public static boolean isCheckGPS = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Workaround in
        // https://stackoverflow.com/questions/16283079/re-launch-of-activity-on-home-button-but-only-the-first-time/16447508
        if (!isTaskRoot()) {
            // Android launched another instance of the root activity into an existing task
            // so just quietly finish and go away, dropping the user back into the activity
            // at the top of the stack (ie: the last state of this task)
            // Don't need to finish it again since it's finished in super.onCreate .
            return;
        }
        sContext = getApplicationContext();
        app = this;
        // DO OTHER INITIALIZATION BELOW
        // SDKWrapper.getInstance().init(this);
        mCocos2dxExitGame = new ExitGameTip(this);
        batteryChangedReceiver = new BatteryChangedReceiver();
        IntentFilter intentFilter = getFilter();
        registerReceiver(batteryChangedReceiver, intentFilter);

        Toast.makeText(AppActivity.sContext, "正在启动游戏,请稍候...", Toast.LENGTH_SHORT).show();

        PushAgent.getInstance(sContext).onAppStart();
    }

    @Override
    public Cocos2dxGLSurfaceView onCreateView() {
        Cocos2dxGLSurfaceView glSurfaceView = new Cocos2dxGLSurfaceView(this);
        // TestCpp should create stencil buffer
        glSurfaceView.setEGLConfigChooser(5, 6, 5, 0, 16, 8);
        // SDKWrapper.getInstance().setGLSurfaceView(glSurfaceView, this);

        return glSurfaceView;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // SDKWrapper.getInstance().onDestroy();
        unregisterReceiver(batteryChangedReceiver);
        EasyThirdParty.getInstance().destroyLocation();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        UMShareAPI.get(this).onActivityResult(requestCode,resultCode,data);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // 自定义返回按键
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            mCocos2dxExitGame.ExitGame();
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    // 复制剪切板
    public static void copyClipper(final String str) {
        new Thread(new Runnable() {
            public void run() {
                Looper.prepare();
                ClipboardManager clipboard = (ClipboardManager) AppActivity.app.getSystemService(AppActivity.sContext.CLIPBOARD_SERVICE);
                // 创建一个剪贴数据集，包含一个普通文本数据条目（需要复制的数据）
                ClipData clipData = ClipData.newPlainText(null, str);
                // 把数据集设置（复制）到剪贴板
                clipboard.setPrimaryClip(clipData);
                // 将文本内容放到系统剪贴板里。
                Toast.makeText(AppActivity.sContext, "复制成功!", Toast.LENGTH_SHORT).show();
                Looper.loop();
            }
        }).start();
    }

    // 打开url
    public static void OpenUrl(final String url) {
        Intent intent = new Intent();
        intent.setAction("android.intent.action.VIEW");
        Uri content_url = Uri.parse(url);
        intent.setData(content_url);
        app.startActivity(intent);
    }

    // 电量
    public class BatteryChangedReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            // 电池当前的电量, 它介于0和 EXTRA_SCALE之间
            float lv = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            if (lv > 0) mBatLv = lv / intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

            //充电
            boolean status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1) == BatteryManager.BATTERY_STATUS_CHARGING;
            if (status) mBatLv = 2;
        }
    }

    private IntentFilter getFilter() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_BATTERY_CHANGED);
        filter.addAction(Intent.ACTION_BATTERY_OKAY);
        return filter;
    }

    public static String getBattery() {
        return String.valueOf(mBatLv);
    }


    // SDK初始化
    public static void initSDK(final String wxID, final String wxSecret, final String umKey,
                               final  String gdKey, final  String umSecret) {
        EasyThirdParty.getInstance().init(AppActivity.app, wxID, wxSecret, umKey, gdKey, umSecret);
    }

    //微信登录
    public static void WXLogin() {
        new Thread(new Runnable() {
            public void run() {
                Looper.prepare();
                Toast.makeText(AppActivity.sContext, "正在请求微信登录,请稍候...", Toast.LENGTH_SHORT).show();

                EasyThirdParty.getInstance().login(SHARE_MEDIA.WEIXIN, new UMAuthListener() {
                    @Override
                    public void onStart(SHARE_MEDIA share_media) {
                    }

                    @Override
                    public void onComplete(SHARE_MEDIA share_media, int i, Map<String, String> map) {
                        try {
                            final JSONObject jObject = new JSONObject();
                            jObject.put("openid", map.get("openid"));
                            jObject.put("unionid", map.get("unionid"));
                            jObject.put("sex", map.get("gender"));
                            jObject.put("headimgurl", map.get("profile_image_url"));
                            Toast.makeText(AppActivity.sContext, "授权成功", Toast.LENGTH_SHORT).show();

                            final String nickName = map.get("name");
                            app.runOnGLThread(new Runnable() {
                                @Override
                                public void run() {
                                    Cocos2dxJavascriptJavaBridge.evalString("native2Cocos('onWXCode','" + jObject.toString() + "','" + nickName + "')");
                                }
                            });
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }

                    @Override
                    public void onError(SHARE_MEDIA share_media, int i, Throwable throwable) {
                        Toast.makeText(AppActivity.sContext, "未知的操作", Toast.LENGTH_SHORT).show();
                    }

                    @Override
                    public void onCancel(SHARE_MEDIA share_media, int i) {
                        Toast.makeText(AppActivity.sContext, "取消微信登陆", Toast.LENGTH_SHORT).show();
                    }
                });
                Looper.loop();
            }
        }).start();
    }

    //微信分享
    public static void WXShareImage(final String path, final String IsTimeLine) {
        Bitmap bmp = null;
        if (path.startsWith("http")) {
            try {
                bmp = BitmapFactory.decodeStream(new URL(path).openStream());
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            bmp = BitmapFactory.decodeFile(path);
        }

        EasyThirdParty.getInstance().shareImage(IsTimeLine.equals("1") ? SHARE_MEDIA.WEIXIN_CIRCLE : SHARE_MEDIA.WEIXIN, "", bmp, new UMShareListener() {
            @Override
            public void onStart(SHARE_MEDIA share_media) {
            }

            @Override
            public void onResult(SHARE_MEDIA share_media) {
                app.runOnGLThread(new Runnable() {
                    @Override
                    public void run() {
                        Cocos2dxJavascriptJavaBridge.evalString("native2Cocos('onShareRes','1')");
                    }
                });
            }

            @Override
            public void onError(SHARE_MEDIA share_media, Throwable throwable) {
                Toast.makeText(AppActivity.sContext, "微信分享图片异常", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onCancel(SHARE_MEDIA share_media) {
                Toast.makeText(AppActivity.sContext, "微信分享图片取消", Toast.LENGTH_SHORT).show();
            }
        });
    }

    //微信分享
    public static void WXShareUrl(final String szTitle, final String szDesrc, final String szRedirectUrl, final String IsTimeLine) {
        EasyThirdParty.getInstance().shareUrl(IsTimeLine.equals("1") ? SHARE_MEDIA.WEIXIN_CIRCLE : SHARE_MEDIA.WEIXIN,
                szTitle, szDesrc, szRedirectUrl, com.chuangsheng.lybq.R.mipmap.ic_launcher, new UMShareListener() {
                    @Override
                    public void onStart(SHARE_MEDIA share_media) {
                    }

                    @Override
                    public void onResult(SHARE_MEDIA share_media) {
                        app.runOnGLThread(new Runnable() {
                            @Override
                            public void run() {
                                Cocos2dxJavascriptJavaBridge.evalString("native2Cocos('onShareRes','1')");
                            }
                        });
                    }

                    @Override
                    public void onError(SHARE_MEDIA share_media, Throwable throwable) {
                        Toast.makeText(AppActivity.sContext, "分享异常", Toast.LENGTH_SHORT).show();
                    }

                    @Override
                    public void onCancel(SHARE_MEDIA share_media) {
                        Toast.makeText(AppActivity.sContext, "取消分享", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    public static boolean requestPermission() {
        if (ContextCompat.checkSelfPermission(AppActivity.app, android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(AppActivity.app, new String[]{android.Manifest.permission.RECORD_AUDIO}, 200);
            return false;
        } else {
            return true;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case 200:
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    Toast.makeText(AppActivity.sContext, "获取到语音权限", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(AppActivity.sContext, "用户拒绝了语音权限", Toast.LENGTH_SHORT).show();
                }
                break;
            case 0:
                isCheckGPS = true;
                if (verifyPermissions(grantResults)) {
                    getGPSInfo();
                }
        }
    }

    public static String isWifi() {
        ConnectivityManager connectivityManager = (ConnectivityManager) AppActivity.sContext.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetInfo = connectivityManager.getActiveNetworkInfo();
        if (activeNetInfo != null && activeNetInfo.getType() == ConnectivityManager.TYPE_WIFI) {
            return "1";
        } else {
            return "0";
        }
    }

    // GPS
    public static void getGPSInfo() {
        if (!isCheckGPS && !checkPermissions(needPermissions)) return;
        EasyThirdParty.getInstance().requestLocation(new EasyThirdParty.OnLocationCallBack() {
            @Override
            public void onLocationResult(boolean bSuccess, int errorCode, final String backMsg) {
                app.runOnGLThread(new Runnable() {
                    @Override
                    public void run() {
                        Cocos2dxJavascriptJavaBridge.evalString("native2Cocos('onUpdateGPS','" + backMsg + "')");
                    }
                });
            }
        });
    }

    private static boolean checkPermissions(String... permissions) {
        //获取权限列表
        List<String> needRequestPermissonList = findDeniedPermissions(permissions);
        if (null != needRequestPermissonList
                && needRequestPermissonList.size() > 0) {
            //list.toarray将集合转化为数组
            ActivityCompat.requestPermissions(AppActivity.app,
                    needRequestPermissonList.toArray(new String[needRequestPermissonList.size()]),
                    0);
            return  false;
        }
        return true;
    }

    private static List<String> findDeniedPermissions(String[] permissions) {
        List<String> needRequestPermissonList = new ArrayList<String>();
        //for (循环变量类型 循环变量名称 : 要被遍历的对象)
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(AppActivity.app,
                    perm) != PackageManager.PERMISSION_GRANTED
                    || ActivityCompat.shouldShowRequestPermissionRationale(
                    AppActivity.app, perm)) {
                needRequestPermissonList.add(perm);
            }
        }
        return needRequestPermissonList;
    }

    private boolean verifyPermissions(int[] grantResults) {
        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }
}
