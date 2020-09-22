import GameView from "../../Game/Public/script/GameView";

interface ISignPackage {
    appId: string;
    nonceStr: string;
    timestamp: string;
    url: string;
    signature: string;
    rawString: string;
}

const wx = (<any>window).wx;
export default class WeChatH5 {

    public static async init() {
        if (!wx) return;
        let url = location.href.split('#')[0];
        let res: ISignPackage = await vv.http.get('/signPackage',
            {url: encodeURIComponent(url).replace(/&/g, '%26')});
        console.log(res, url);
        wx.config({
            // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印
            debug: false,
            appId: res.appId, // 必填，公众号的唯一标识
            timestamp: res.timestamp, // 必填，生成签名的时间戳
            nonceStr: res.nonceStr, // 必填，生成签名的随机串
            signature: res.signature,// 必填，签名
            jsApiList: [
                'updateAppMessageShareData',
                'updateTimelineShareData',
                'onMenuShareAppMessage',
                'onMenuShareTimeline',
                'showMenuItems',
                'uploadVoice',
                'onVoicePlayEnd',
                'stopVoice',
                'playVoice',
                'onVoiceRecordEnd',
                'stopRecord',
                'downloadVoice',
                'startRecord',
                'getLocation',
            ] // 必填，需要使用的JS接口列表
        });

        wx.ready(() => {
            this.setShareInfo({
                title: '【乐友宝清】',
                desc: '能否与我一战！'
            });
            this.getGPSInfo();
            wx.onVoiceRecordEnd({
                complete: (res) => {
                    let js = g_CurScence.getComponent(GameView);
                    if (js) js.stopRecord();
                    if (res.localId) {
                        this.uploadVoice(res.localId);
                    }
                }
            });

        });
        wx.error(function (res) {
            console.log(res);
        });
    }

    public static setShareInfo(p: { link?: string, title: string, desc: string, imgUrl?: string, data?: string }) {
        if (!wx) return;
        let url = location.protocol + "//" + location.host;
        if (!p.link) p.link = url + '/jump';
        if (p.data) p.link += '?state=' + window.btoa(p.data);
        if (!p.imgUrl) p.imgUrl = url + '/icon.png';
        console.log(p);
        this.shareFriend(p);
        this.shareTimeline(p);
    }

    public static shareFriend(p: { link?: string; title: string; desc: string, imgUrl?: string; }) {
        if (!wx) return;
        wx.updateAppMessageShareData({
            title: p.title, // 分享标题
            desc: p.desc, // 分享描述
            link: p.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
            imgUrl: p.imgUrl, // 分享图标
            success: function (res) {
                console.log('分享成功', res);
            },
            cancel: function () {
                console.log('取消分享');
            }
        })
    }

    public static shareTimeline(p: { link?: string; title: string; desc: string, imgUrl?: string; }) {
        if (!wx) return;
        wx.updateTimelineShareData({
            title: p.title, // 分享标题
            link: p.link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
            imgUrl: p.imgUrl, // 分享图标
            success: function (res) {
                console.log('分享成功', res);
            },
            cancel: function () {
                console.log('取消分享');
            }
        });
    }

    public static async getNetType() {
        if (!wx) return;
        return new Promise((resolve, reject) => {
            wx.getNetworkType({
                success: function (res) {
                    console.log('网络', res);
                    resolve(res);
                }
            });
        })
    }

    public static getGPSInfo() {
        if (!wx) return;
        wx.getLocation({
            type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
            success: function (res) {
                (<any>window).native2Cocos('onUpdateGPS', JSON.stringify({
                    berror: false,
                    code: 0,
                    msg: '',
                    latitude: res.latitude,
                    longitude: res.longitude,
                    address: 'H5不支持获取地址',
                    sortadd: 'H5不支持获取地址',
                }));
            }
        });
    }

    public static startRecord() {
        if (!wx) return;
        wx.startRecord();
    }

    public static stopRecord() {
        if (!wx) return;
        wx.stopRecord({
            success: (res) => {
                if (res.localId) {
                    this.uploadVoice(res.localId);
                }
            }
        });
        return 'wait';
    }

    public static uploadVoice(id: any) {
        if (!wx) return;
        if (!id) return;
        wx.uploadVoice({
            localId: id,
            isShowProgressTips: 1,
            success: function (res) {
                vv.gameClient.sendFrame('onChat', {
                    sign: 5,
                    msg: res.serverId
                });
            }
        })
    }
}
