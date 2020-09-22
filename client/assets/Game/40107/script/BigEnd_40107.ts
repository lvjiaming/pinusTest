import BaseClass from "../../../Common/script/BaseClass";
import ThirdParty from "../../../Common/script/ThirdParty";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import UserCtrl from "../../../Common/script/UserCtrl";
import WeChatH5 from "../../../Common/script/WeChatH5";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BigEnd_52200 extends BaseClass {

    @property(cc.Node)
    layout: cc.Node = null;

    public setView(data: { score: number[], winCnt: number[], bombCnt: number[], bankCnt: number[] }) {
        let idx = 0, winUser = -1, winScore = 0;
        for (let i = 0; i < data.score.length; i++) {
            if (!vv.gameClient.sitUser[i]) continue;
            if (data.score[i] > winScore) {
                winUser = i;
                winScore = data.score[i];
            }
        }
        for (let i = 0; i < data.score.length; i++) {
            if (!vv.gameClient.sitUser[i]) continue;
            let node = this.layout.children[idx++] || cc.instantiate(this.layout.children[0]);
            node.parent = this.layout;
            let js = node.getComponent(UIKillerClass);
            js.$('_userInfo', UserCtrl).setUserByID(vv.gameClient.sitUser[i].UserInfo.UserID);
            js.$('_labScore', cc.Label).string = data.score[i] > 0 ? ('+' + data.score[i]) : (data.score[i] + '');
            js.$('_win').active = data.score[i] > 0;
            js.$('_lose').active = data.score[i] <= 0;
            js.$('_bigWin').active = winUser == i;
            js.$('_labWinCnt', cc.Label).string = data.winCnt[i] + '';
            js.$('_labBombCnt', cc.Label).string = data.bombCnt[i] + '';
            js.$('_labBankCnt', cc.Label).string = data.bankCnt[i] + '';
        }
        if (cc.sys.isBrowser) {
            let str = '';
            for (let i in vv.gameClient.sitUser) {
                str += vv.gameClient.sitUser[i].UserInfo.NickName + '：' + data.score[i] + '；';
            }
            WeChatH5.setShareInfo({
                title: `【房间号:${vv.roomInfo.RoomID}】`,
                desc: str
            });
        }
    }

    _onBtReturn() {
        cc.director.loadScene('Hall');
    }

    _onBtShare() {
        if (cc.sys.isNative) {
            ThirdParty.WXShareImage(ThirdParty.saveImage(this.node));
        } else {
            this.showPrefab('ShareTips');
        }
    }
}
