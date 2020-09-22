package org.cocos2dx.javascript;

import android.graphics.Bitmap;

import com.amap.api.location.AMapLocation;
import com.amap.api.location.AMapLocationClient;
import com.amap.api.location.AMapLocationClientOption;
import com.amap.api.location.AMapLocationListener;
import com.umeng.commonsdk.UMConfigure;
import com.umeng.socialize.PlatformConfig;
import com.umeng.socialize.ShareAction;
import com.umeng.socialize.UMAuthListener;
import com.umeng.socialize.UMShareAPI;
import com.umeng.socialize.UMShareConfig;
import com.umeng.socialize.UMShareListener;
import com.umeng.socialize.bean.SHARE_MEDIA;
import com.umeng.socialize.media.UMImage;
import com.umeng.socialize.media.UMWeb;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

public class EasyThirdParty {

    private AppActivity mContext = null;
    private static final String TAG = "EasyThirdParty";

    public static String UM_KEY = "";
    public static String WX_APP_ID = "";
    public static String WX_SECRET = "";
    public static String GD_KEY = "";
    public static String UM_SECRET = "";

    //高德
    private AMapLocationClient locationClient = null;
    // 定位监听
    private AMapLocationListener locationListener = null;
    // 定位结果回调
    private EasyThirdParty.OnLocationCallBack mLocationCallback = null;

    private static EasyThirdParty mEasyThirdParty;

    public static EasyThirdParty getInstance() {
        if (mEasyThirdParty == null) {
            mEasyThirdParty = new EasyThirdParty();
        }
        return mEasyThirdParty;
    }

    public void init(AppActivity context, String wxID, String wxSecret, String umKey, String gdKey, String umSecret) {
        UM_KEY = umKey;
        WX_APP_ID = wxID;
        WX_SECRET = wxSecret;
        GD_KEY = gdKey;
        UM_SECRET = umSecret;
        mContext = context;
        //配置友盟
        doConfigUM();
        doConfigAMAP();
    }

    private void doConfigUM() {
        PlatformConfig.setWeixin(WX_APP_ID, WX_SECRET);
        UMConfigure.setLogEnabled(true);
        UMConfigure.init(AppActivity.sContext, UM_KEY, "Umeng", UMConfigure.DEVICE_TYPE_PHONE,
                UM_SECRET);
    }

    //登录
    public void login(SHARE_MEDIA platform, final UMAuthListener umAuthListener) {
        UMShareConfig config = new UMShareConfig();
        config.isNeedAuthOnGetUserInfo(true);
        UMShareAPI.get(mContext).setShareConfig(config);

        UMShareAPI mShareAPI = UMShareAPI.get(mContext);

        if (!mShareAPI.isInstall(mContext, platform)) {
            return;
        }
        mShareAPI.getPlatformInfo(mContext, platform, umAuthListener);
    }

    public void shareUrl(SHARE_MEDIA platform, String title, String description, String url, int thumbRes, final UMShareListener shareListener) {
        //压缩
        UMImage thumb = new UMImage(mContext, thumbRes);
        UMWeb web = new UMWeb(url);
        web.setTitle(title);//标题
        web.setThumb(thumb);  //缩略图
        web.setDescription(description);//描述

        new ShareAction(mContext)
                .setPlatform(platform)
                .withMedia(web)
                .setCallback(shareListener)
                .share();
    }

    //分享图片 文字
    public void shareImage(SHARE_MEDIA platform, String text, Object imageObj, final UMShareListener shareListener) {
        UMShareAPI mShareAPI = UMShareAPI.get(mContext);
        if (!mShareAPI.isInstall(mContext, platform)) {
            return;
        }
        if (imageObj == null) {
            new ShareAction(mContext)
                    .setPlatform(platform)
                    .withText(text)
                    .setCallback(shareListener)
                    .share();
            return;
        }

       /* UMImage image = new UMImage(ShareActivity.this, "imageurl");//网络图片
        UMImage image = new UMImage(ShareActivity.this, file);//本地文件
        UMImage image = new UMImage(ShareActivity.this, R.drawable.xxx);//资源文件
        UMImage image = new UMImage(ShareActivity.this, bitmap);//bitmap文件
        UMImage image = new UMImage(ShareActivity.this, byte[]);//字节流*/
        UMImage image = null;
        if (imageObj instanceof String) {
            image = new UMImage(mContext, (String) imageObj);
        } else if (imageObj instanceof File) {
            image = new UMImage(mContext, (File) imageObj);
        } else if (imageObj instanceof Integer) {
            image = new UMImage(mContext, (int) imageObj);
        } else if (imageObj instanceof Bitmap) {
            image = new UMImage(mContext, (Bitmap) imageObj);
        } else if (imageObj instanceof byte[]) {
            image = new UMImage(mContext, (byte[]) imageObj);
        }
        new ShareAction(mContext)
                .setPlatform(platform)
                .withText(text)
                .withMedia(image)
                .setCallback(shareListener)
                .share();

    }

    //定位(高德)
    //配置高德地图
    private void doConfigAMAP() {
        AMapLocationClientOption locationOption = new AMapLocationClientOption();
        locationOption.setLocationMode(AMapLocationClientOption.AMapLocationMode.Hight_Accuracy);//可选，设置定位模式，可选的模式有高精度、仅设备、仅网络。默认为高精度模式
        locationOption.setGpsFirst(false);//可选，设置是否gps优先，只在高精度模式下有效。默认关闭
        locationOption.setHttpTimeOut(30000);//可选，设置网络请求超时时间。默认为30秒。在仅设备模式下无效
        locationOption.setInterval(2000);//可选，设置定位间隔。默认为2秒
        locationOption.setNeedAddress(true);//可选，设置是否返回逆地理地址信息。默认是true
        locationOption.setOnceLocation(true);//可选，设置是否单次定位。默认是false
        locationOption.setOnceLocationLatest(false);//可选，设置是否等待wifi刷新，默认为false.如果设置为true,会自动变为单次定位，持续定位时不要使用
        AMapLocationClientOption.setLocationProtocol(AMapLocationClientOption.AMapLocationProtocol.HTTP);//可选， 设置网络请求的协议。可选HTTP或者HTTPS。默认为HTTP
        locationOption.setSensorEnable(false);//可选，设置是否使用传感器。默认是false
        // locationOption.setWifiScan(true); //可选，设置是否开启wifi扫描。默认为true，如果设置为false会同时停止主动刷新，停止以后完全依赖于系统刷新，定位位置可能存在误差
        //locationOption.setLocationCacheEnable(true); //可选，设置是否使用缓存定位，默认为true
        //locationOption.setGeoLanguage(AMapLocationClientOption.GeoLanguage.DEFAULT);//可选，设置逆地理信息的语言，默认值为默认语言（根据所在地区选择语言）


        // 定位监听
        locationListener = new AMapLocationListener() {
            @Override
            public void onLocationChanged(AMapLocation loc) {
                boolean bRes = false;
                int errorCode = -1;
                String backMsg = "";
                if (null != loc) {
                    //定位结果信息
                    /*if (location.getErrorCode() == 0) {
                        sb.append("定位成功" + "\n");
                        sb.append("定位类型: " + location.getLocationType() + "\n");
                        sb.append("经    度    : " + location.getLongitude() + "\n");
                        sb.append("纬    度    : " + location.getLatitude() + "\n");
                        sb.append("精    度    : " + location.getAccuracy() + "米" + "\n");
                        sb.append("提供者    : " + location.getProvider() + "\n");

                        sb.append("速    度    : " + location.getSpeed() + "米/秒" + "\n");
                        sb.append("角    度    : " + location.getBearing() + "\n");
                        // 获取当前提供定位服务的卫星个数
                        sb.append("星    数    : " + location.getSatellites() + "\n");
                        sb.append("国    家    : " + location.getCountry() + "\n");
                        sb.append("省            : " + location.getProvince() + "\n");
                        sb.append("市            : " + location.getCity() + "\n");
                        sb.append("城市编码 : " + location.getCityCode() + "\n");
                        sb.append("区            : " + location.getDistrict() + "\n");
                        sb.append("区域 码   : " + location.getAdCode() + "\n");
                        sb.append("地    址    : " + location.getAddress() + "\n");
                        sb.append("兴趣点    : " + location.getPoiName() + "\n");
                        //定位完成的时间
                        // sb.append("定位时间: " + Utils.formatUTC(location.getTime(), "yyyy-MM-dd HH:mm:ss") + "\n");
                    } else {
                        //定位失败
                        sb.append("定位失败" + "\n");
                        sb.append("错误码:" + location.getErrorCode() + "\n");
                        sb.append("错误信息:" + location.getErrorInfo() + "\n");
                        sb.append("错误描述:" + location.getLocationDetail() + "\n");
                    }
                    sb.append("***定位质量报告***").append("\n");
                    sb.append("* WIFI开关：").append(location.getLocationQualityReport().isWifiAble() ? "开启" : "关闭").append("\n");
                    sb.append("* GPS状态：").append(getGPSStatusString(location.getLocationQualityReport().getGPSStatus())).append("\n");
                    sb.append("* GPS星数：").append(location.getLocationQualityReport().getGPSSatellites()).append("\n");
                    sb.append("* 网络类型：" + location.getLocationQualityReport().getNetworkType()).append("\n");
                    sb.append("* 网络耗时：" + location.getLocationQualityReport().getNetUseTime()).append("\n");
                    sb.append("****************").append("\n");*/
                    //解析定位结果

                    errorCode = loc.getErrorCode();
                    if (0 == loc.getErrorCode()) {
                        JSONObject jObject = new JSONObject();
                        try {
                            bRes = true;
                            jObject.put("berror", false);
                            jObject.put("code", errorCode);
                            jObject.put("msg", loc.getErrorInfo());
                            jObject.put("latitude", loc.getLatitude());
                            jObject.put("longitude", loc.getLongitude());
                            jObject.put("address", loc.getAddress());
                            jObject.put("sortadd", loc.getProvince() + loc.getCity() + loc.getDistrict());
                            backMsg = jObject.toString();
                        } catch (JSONException e) {
                            backMsg = "定位数据解析异常!" + loc.getErrorInfo();
                            e.printStackTrace();
                        }
                    } else {
                        JSONObject jObject = new JSONObject();
                        try {
                            bRes = true;
                            jObject.put("berror", true);
                            jObject.put("code", errorCode);
                            jObject.put("msg", loc.getErrorInfo());
                            backMsg = jObject.toString();
                        } catch (JSONException e) {
                            backMsg = "定位数据解析异常!" + loc.getErrorInfo();
                            e.printStackTrace();
                        }
                        locationClient.stopLocation();
                    }
                } else {
                    backMsg = "定位异常!";
                }

                if (null != mLocationCallback) {
                    mLocationCallback.onLocationResult(bRes, errorCode, backMsg);
                }
                locationClient.stopLocation();
            }
        };


        // 初始化client
        locationClient = new AMapLocationClient(mContext.getApplicationContext());
        locationClient.setApiKey(GD_KEY);
        // 设置定位参数
        locationClient.setLocationOption(locationOption);
    }

    public static interface OnLocationCallBack {
        //bSuccess  定位回调状态
        //errorCode错误码  -1为初始化失败  0成功 参考 https://lbs.amap.com/api/android-location-sdk/guide/utilities/errorcode
        public void onLocationResult(boolean bSuccess, int errorCode, String backMsg);
    }

    // 请求单次定位
    public void requestLocation(EasyThirdParty.OnLocationCallBack mLocationCallback) {
        this.mLocationCallback = mLocationCallback;
        if (null != locationClient && null != locationListener) {
            locationClient.stopLocation();
            // 设置定位监听
            locationClient.setLocationListener(locationListener);
            // 定位请求
            locationClient.startLocation();
        } else {
            mLocationCallback.onLocationResult(false, -1, "定位服务初始化失败!");
        }
    }

    public void destroyLocation() {
        if (null != getInstance().locationClient) {
            /**
             * 如果AMapLocationClient是在当前Activity实例化的，
             * 在Activity的onDestroy中一定要执行AMapLocationClient的onDestroy
             */
            getInstance().locationClient.onDestroy();
            getInstance().locationClient = null;
            getInstance().locationClient = null;
        }
    }
}
