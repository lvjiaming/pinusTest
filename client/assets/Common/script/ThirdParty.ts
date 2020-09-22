import WeChatH5 from "./WeChatH5";

export default class ThirdParty {

    public static loginLink: string = '';
    public static h5Pram: string = '';
    private static wxID = 'wx43a9d2ec5939fd4a';
    private static wxSecret = 'bd2764d918a40fcd07d589ae71fdf13b';
    // 正式
    private static umKey = '5e4b4f57570df35989000069';
    private static umSecret = '';
    private static gdKey = '10036417bf49a644209b19d0112fcc7a';
    private static startRecord: number = 0;

    public static updateGPSTimes = 0;

    public static async initSDK() {
        if (cc.sys.isNative) {
            console.log('initSDK', this.wxID);
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "initSDK:weiXinSecret:umKey:amapKey:",
                    this.wxID, this.wxSecret, this.umKey, this.gdKey);
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "initSDK",
                    "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
                    this.wxID, this.wxSecret, this.umKey, this.gdKey, this.umSecret);
            }
            this.getGPSInfo();
        }
        if (cc.sys.browserType == cc.sys.BROWSER_TYPE_WECHAT) {
            await WeChatH5.init();
        }
    }

    //微信相关
    public static WXLogin() {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "WXLogin", "");
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "WXLogin", "()V");
            }
        }
    }

    public static WXShareUrl(ShareInfo: { link: string, title: string, desc: string, imgUrl?: string }, isLine?: boolean) {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "WXSharetitle:description:url:IsTimeLine:",
                    ShareInfo.title, ShareInfo.desc, ShareInfo.link, isLine ? '1' : '0');
            } else {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'WXShareUrl',
                    "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
                    ShareInfo.title, ShareInfo.desc, ShareInfo.link, isLine ? '1' : '0');
            }
        }
    }

    public static WXShareImage(Path, isLine?: boolean) {
        if (Path == '') return;
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "WXShareTex:IsTimeLine:",
                    Path, isLine ? '1' : '0');
            } else {
                jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', 'WXShareImage',
                    "(Ljava/lang/String;Ljava/lang/String;)V",
                    Path, isLine ? '1' : '0');
            }
        }
    }

    //原生功能
    public static getBattery() {
        let pLv = '1';
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                pLv = jsb.reflection.callStaticMethod('AppController', "getBattery", "");
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                pLv = jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', "getBattery", "()Ljava/lang/String;");
            }
        }
        return parseFloat(pLv);
    }

    public static isWifi(): number {
        let pLv = '1';
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                pLv = jsb.reflection.callStaticMethod('AppController', "isWifi", '');
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                pLv = jsb.reflection.callStaticMethod('org/cocos2dx/javascript/AppActivity', "isWifi", "()Ljava/lang/String;");
            }
        }

        return parseInt(pLv);
    }

    public static copyClipper(address: string) {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "CopyClipper:", address);
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity",
                    "copyClipper",
                    "(Ljava/lang/String;)V",
                    address);
            }
        }
    }

    public static openUrl(address: string) {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "OpenUrl:", address);
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity",
                    "openUrl",
                    "(Ljava/lang/String;)V",
                    address);
            }
        } else {
            window.open(address);
        }
    }

    // 语音
    public static statrRecord() {
        ThirdParty.startRecord = Date.now();
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "startRecord", "");
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/VoiceCtrl",
                    "startRecord",
                    "()V");
            }
        }
        if (cc.sys.isBrowser) {
            WeChatH5.startRecord();
        }
    }

    public static stopRecord(): string {
        let fn = () => {
            let str = '';
            if (cc.sys.isNative) {
                if (cc.sys.OS_IOS == cc.sys.os) {
                    str = jsb.reflection.callStaticMethod("AppController", "stopRecord", "");
                } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                    str = jsb.reflection.callStaticMethod("org/cocos2dx/javascript/VoiceCtrl",
                        "stopRecord",
                        "()Ljava/lang/String;");
                }
            }
            if (cc.sys.isBrowser) {
                str = WeChatH5.stopRecord();
            }
            return str;
        };

        if ((Date.now() - ThirdParty.startRecord) / 1000 < 1) {
            setTimeout(fn, 1000);
            return ''
        } else {
            return fn();
        }
    }

    public static async playVoice(str: string) {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "playVoice:", str);
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/VoiceCtrl",
                    "playVoice",
                    "(Ljava/lang/String;)V", str);
            }
        } else if (cc.sys.isBrowser) {
            let video = document.createElement('audio');
            video.src = 'data:audio/mp4;base64,' + str;
            if (cc.sys.OS_IOS == cc.sys.os) {
                (<any>window).WeixinJSBridge.invoke('getNetworkType', {}, function(e) {
                    video.play();
                });
            } else {
                video.autoplay = true;
            }
            video.addEventListener("ended", () => {
                video.remove();
                g_CurScence.onPlayFinish();
            }, false);
        }
    }

    public static getGPSInfo(): void {
        this.updateGPSTimes = 0;
        this._getGPSInfo();
    }

    public static _getGPSInfo() {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS == cc.sys.os) {
                jsb.reflection.callStaticMethod("AppController", "getGPSInfo", "");
            } else if (cc.sys.OS_ANDROID == cc.sys.os) {
                jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity",
                    "getGPSInfo",
                    "()V");
            }
        }
        if (cc.sys.isBrowser) {
            WeChatH5.getGPSInfo();
        }
    }


    public static saveImage(node): string {
        if (!cc.sys.isNative) return '';
        let width = Math.floor(node.width);
        let height = Math.floor(node.height);
        if (width == 0 || height == 0) {
            console.log('节点尺寸为零分享异常');
            return '';
        }
        if (CC_JSB) {
            let fileName = "result_share.jpg";
            let fullPath = jsb.fileUtils.getWritablePath() + fileName;
            if (jsb.fileUtils.isFileExist(fullPath)) {
                jsb.fileUtils.removeFile(fullPath);
            }

            let cameraNode = new cc.Node();
            cameraNode.parent = node.parent;
            let camera = cameraNode.addComponent(cc.Camera);
            camera.cullingMask = 0xffffffff;

            let texture = new cc.RenderTexture();
            let gfx = (<any>cc).gfx;
            texture.initWithSize(width, height, gfx.RB_FMT_S8);
            camera.targetTexture = texture;
            camera.render(node);

            let data = texture.readPixels();

            //以下代码将截图后默认倒置的图片回正
            let picData = new Uint8Array(width * height * 4);
            let rowBytes = width * 4;
            for (let row = 0; row < height; row++) {
                let srow = height - 1 - row;
                let start = Math.floor(srow * width * 4);
                let reStart = row * width * 4;
                // save the piexls data
                for (let i = 0; i < rowBytes; i++) {
                    picData[reStart + i] = data[start + i];
                }
            }
            //保存图片
            (<any>jsb).saveImageData(picData, width, height, fullPath);
            node.parent.removeChild(camera);
            return fullPath;
        }
    }

    public static getQueryString(name) { //输入参数名称
        if (cc.sys.isBrowser) {//
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); //根据参数格式，正则表达式解析参数

            var r = window.location.search.substr(1).match(reg);

            if (r != null) return unescape(r[2]);
        }
        return null; //返回参数值
    }
}
