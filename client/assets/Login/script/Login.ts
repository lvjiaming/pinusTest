import BaseClass from "../../Common/script/BaseClass";
import ThirdParty from "../../Common/script/ThirdParty";
import WeChatH5 from "../../Common/script/WeChatH5";

const {ccclass, property} = cc._decorator;

var gLogin = true;

function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

@ccclass
export default class Login extends BaseClass {

    // LIFE-CYCLE CALLBACKS:

    static updateGPSTimes: number = 0;

    public onLoad() {
        this.node.scaleY = cc.view.getVisibleSize().height / SCENE_HEIGHT;
        cc.audioEngine.stopMusic();
        (<any>window).g_CurScence = this;

        var url;
        var version = this.node.getChildByName("version").getComponent(cc.Label);
        var Paths = cc.sys.localStorage.getItem('HotUpdateSearchPaths');
        if (Paths) {
            url = JSON.parse(Paths)[0] + '/project.manifest';
        } else {
            url = cc.url.raw('resources/project.manifest');
        }
        cc.loader.load(url, function (err, data) {
            var localInfo = JSON.parse(data);
            console.log(localInfo.version);
            version.string = "版本号:V" + localInfo.version;
        });

        let acc = cc.sys.localStorage.getItem(GAME_NAME + "userAcc");
        let psw = cc.sys.localStorage.getItem(GAME_NAME + "userPsw");
        if (cc.sys.isBrowser && (cc.sys.os == cc.sys.OS_WINDOWS || cc.sys.os == cc.sys.OS_OSX) && (gLogin || acc)) {
            let acc = ThirdParty.getQueryString("AAcc");
            if (acc) {
                this.loginAccount(acc, ThirdParty.getQueryString('APsw'));
                gLogin = false;
            }
        } else if (acc) {
            let md5 = cc.sys.localStorage.getItem(GAME_NAME + "userMD5Psw");
            if (md5) {
                this._login(acc, md5)
            } else {
                this.loginAccount(acc, psw);
            }
        }
        Login.updateGPSTimes = 0;
    }

    enter() {

    }

    onDestroy() {
        super.onDestroy();
        g_CurScence = null;
    }

    public onLoginSuccess(res: IResponse) {
        let data: { userInfo: IUserInfo, roomInfo: IRoomBaseInfo } = res.data;
        data.userInfo.NickName = decodeURI(data.userInfo.NickName);
        vv.userInfo = data.userInfo;
        cc.sys.localStorage.setItem(GAME_NAME + "userAcc", vv.userInfo.Accounts);
        cc.sys.localStorage.setItem(GAME_NAME + "userMD5Psw", vv.userInfo.LogonPass);
        if (data.roomInfo) {
            vv.roomInfo = data.roomInfo;
            cc.director.loadScene(data.roomInfo.KindID + '');
            return;
        }
        cc.director.loadScene('Hall');
    }

    public async loginAccount(acc: string, psw: string) {
        const md5Psw = vv.md5(psw);
        await this._login(acc, md5Psw);
        cc.sys.localStorage.setItem(GAME_NAME + "userAcc", acc);
        cc.sys.localStorage.setItem(GAME_NAME + "userPsw", psw);
    }

    public async onWXCode(code: string, name: string) {
        if (vv.pinus.connected) {
            const route = 'connector.loginHandler.loginWeChat';
            const info = JSON.parse(code);
            info.name = encodeURI(name);
            const res: IResponse = await vv.pinus.request(route, info);
            if (res.status != 0) {
                this.showAlert(res.msg);
                return;
            }
            this.onLoginSuccess(res)
        } else {
            setTimeout(this.onWXCode.bind(this, code, name), 200);
        }

    }

    private _errorExit(reason) {
        this.showAlert('网络不稳定已断开连接', Alert.Yes, (res: boolean) => {
            cc.director.loadScene('start');
        });
    }

    private async _login(acc: string, psw: string) {
        const route = 'connector.loginHandler.loginAccount';
        const res: IResponse = await vv.pinus.request(route, {
            acc: acc,
            psw: psw
            // acc: '8ae407f953b211eabc6a00163e0b4d87',
            // psw: 'e10adc3949ba59abbe56e057f20f883e'
        });
        if (res.status != 0) {
            this.showAlert(res.msg);
            return;
        }
        this.onLoginSuccess(res)
    }

    ////////////////////////////////////////////////////////////////////////////////////// 点击事件
    private async _onBtWeChat(event: cc.Component.EventHandler, data: string) {
        if (this._checkAgree()) return;
        ThirdParty.WXLogin();
    }

    private _onBtAgreement() {
        this.showPrefab('Agreement');
    }

    private _onBtAccount() {
        this.showPrefab('LoginDlg');
    }

    private _onBtAgree() {
    }

    private _checkAgree() {
        if (!this.$('_btAgree', cc.Toggle).isChecked) {
            this.showTips('请勾选用户协议！');
            return true;
        }
        return false;
    }


    // update (dt) {}
}