import AudioEngine from "../../Common/script/AudioEngine";
import Pinus from "../../Common/script/Pinus";
import Preload from "../../Common/script/Preload";
import ThirdParty from "../../Common/script/ThirdParty";
import UIKiller from "../../Common/script/UIKiller";
import HotUpdate from "./HotUpdate";
import Http from "../../Common/script/Http";
import GameClient from "../../Game/Public/script/GameClient";

const {ccclass, property} = cc._decorator;

//global define
(<any>window).Alert = {
    Yes: 0,
    YesNo: 1,
    All: 2
};
(<any>window).SCENE_WIGHT = 1280;
(<any>window).SCENE_HEIGHT = 720;
(<any>window).LOG_NET = true;
// (<any>window).SERVER_IP = '39.98.150.71';
(<any>window).SERVER_IP = '127.0.0.1';
// (<any>window).SERVER_IP = '192.168.0.53';
(<any>window).SERVER_PORT = '3014';
(<any>window).HTTP_PORT = '3000';
(<any>window).GAME_NAME = 'BaoQingMJ';
(<any>window).g_CurScence = null;
(<any>window).g_IPConfig = null;
(<any>window).g_isHide = false;
(<any>window).SHARE_URL = 'https://bccji.com/p/A07e84yba9x';
(<any>window).native2Cocos = function (fn: string, data: any, name?: string) {
    console.log('native2Cocos', fn, data);
    if (!g_CurScence) return;
    if (fn == 'onUpdateGPS') {
        let obj: IGPSInfo = JSON.parse(data);
        if (obj.berror || obj.sortadd == '') {
            if (ThirdParty.updateGPSTimes > 5) return;
            ThirdParty.updateGPSTimes++;
            setTimeout(() => {
                ThirdParty._getGPSInfo();
            }, 500);
            return;
        }
        vv.gps = obj;
        if (g_CurScence.getComponent(GameClient) && vv.gameClient) {
            vv.gameClient.sendFrame('updateGPS', obj);
        }
        return;
    }
    if (g_CurScence[fn]) {
        console.log('native2Cocos enter');
        g_CurScence[fn](data, name);
    }
};

cc.game.on(cc.game.EVENT_HIDE, () => {
    g_isHide = true;
    vv.pinus.disconnect();
});
cc.game.on(cc.game.EVENT_SHOW, async () => {
    await reConnect();
});
cc.view.setResizeCallback(function (params) {
    console.log(cc.view.getVisibleSize().height, SCENE_HEIGHT);
    g_CurScence.node.scaleY = cc.view.getVisibleSize().height / SCENE_HEIGHT;
});

async function reConnect() {
    console.log('开始重连');
    if (vv.pinus.connected) {
        g_isHide = true;
        vv.pinus.disconnect();
    }
    if (g_CurScence) {
        let name = g_CurScence.name.match(/<.*>$/)[0].slice(1, -1);
        if (g_IPConfig) {
            await vv.pinus.init(g_IPConfig);
            if (name == 'Start') {
                cc.director.loadScene('Login');
            } else {
                if (name != 'Login' && vv.userInfo) {
                    const route = 'connector.loginHandler.loginAccount';
                    const res: IResponse = await vv.pinus.request(route, {
                        acc: vv.userInfo.Accounts,
                        psw: vv.userInfo.LogonPass
                    });
                }
                if (g_CurScence && g_CurScence.enter) {
                    g_CurScence.enter();
                }
            }
        } else {
            await g_CurScence.queryEntry();
        }
    }
    g_isHide = false;
}

@ccclass
export default class Start extends cc.Component {

    @property(cc.Label)
    public m_labDesc: cc.Label = null;

    private _ipConfig: IPConfig = {
        host: SERVER_IP,
        port: SERVER_PORT,
        log: true
    };

    public async onLoad() {

        this.node.scaleY = cc.view.getVisibleSize().height / SCENE_HEIGHT;
        if ((<any>window).vv == undefined) {
            (<any>window).vv = {};
            vv.pinus = new Pinus();
            vv.uikiller = new UIKiller();
            vv.preload = new Preload();
            vv.md5 = (<any>window).hex_md5;
            vv.audio = new AudioEngine();
            vv.replay = null;
            vv.http = new Http();

            vv.pinus.on('disconnect', (reason) => {
                console.log('disconnect event');
                if (g_isHide) return;
                setTimeout(reConnect, 2000);
                console.log('断开连接');
            });
            vv.pinus.on('io-error', (reason) => {
                console.log('连接异常');
            });
            vv.pinus.on('onKick', (reason) => {
                console.log('被踢了');
                g_isHide = true;
                vv.pinus.disconnect();
                cc.sys.localStorage.setItem(GAME_NAME + "userAcc", '');
                cc.sys.localStorage.setItem(GAME_NAME + "userPsw", '');
                if (g_CurScence && g_CurScence.showAlert) {
                    g_CurScence.showAlert('您的账号正在其它地方登陆!', Alert.Yes, () => {
                        cc.director.loadScene('Start');
                    });
                }
            });
            ThirdParty.initSDK();
        }

        // // 测试
        // await vv.pinus.init({
        //     host: SERVER_IP,
        //     port: "3010",
        //     log: true,
        // } as IPConfig);
        // cc.log("连接成功");

        cc.audioEngine.stopMusic();
        g_CurScence = this;

        let js = this.node.getComponent(HotUpdate)
        if (cc.sys.isNative && js) {
            js.updateHotRes(this);
            return;
        }

        this.enter();
    }

    async enter() {
        await this.queryEntry();
    }

    onDestroy() {
        // super.onDestroy();
        g_CurScence = null;
    }

    // query connector
    public async queryEntry() {

        this.m_labDesc.string = '正在加载游戏资源...';
        let js = this.node.getComponent(HotUpdate)
        await vv.preload.loadPicture();
        await vv.preload.loadPrefab((completedCount: number, totalCount: number, item: any) => {
            js.m_progressBar.progress = completedCount / totalCount / 2;
        });
        await vv.preload.loadSounds((completedCount: number, totalCount: number, item: any) => {
            js.m_progressBar.progress = completedCount / totalCount / 2 + 0.5;
        });

        this.m_labDesc.string = '正在连接...';
        await vv.pinus.init(this._ipConfig);
        var route = 'gate.gateHandler.queryEntry';
        var res = await vv.pinus.request(route, {
            uid: (new Date()).toString()
        });
        if (res.code != 200) {
            return;
        }
        g_IPConfig = {
            host: res.host,
            port: res.port,
            log: true
        };
        vv.pinus.disconnect();
        g_isHide = true;
        await vv.pinus.init(g_IPConfig);
        g_isHide = false;
        if (ThirdParty.getQueryString('Code')) {
            this.loginWXH5(ThirdParty.getQueryString('Code'));
        } else {
            cc.director.loadScene('Login');
        }
    }

    private async loginWXH5(code: string) {
        let route = 'connector.loginHandler.loginWXH5';
        let res: IResponse = await vv.pinus.request(route, {code: code});
        if (res.status != 0) {
            console.log(res);
            return;
        }
        let data: { userInfo: IUserInfo, roomInfo: IRoomBaseInfo } = res.data;
        data.userInfo.NickName = decodeURI(data.userInfo.NickName);
        vv.userInfo = data.userInfo;
        if (data.roomInfo) {
            vv.roomInfo = data.roomInfo;
            cc.director.loadScene(data.roomInfo.KindID + '');
            return;
        }
        let state = ThirdParty.getQueryString('state');
        if (state != '0' && state != null) {
            route = 'hall.roomHandler.joinRoom';
            state = JSON.parse(window.atob(state));
            res = await vv.pinus.request(route, { roomID: (<any>state).roomID });
            if (res.status != 0) {
                cc.director.loadScene('Hall');
                return;
            }
            vv.roomInfo = res.data;
            cc.director.loadScene(vv.roomInfo.KindID + '')
        }
        cc.director.loadScene('Hall');
    }
}