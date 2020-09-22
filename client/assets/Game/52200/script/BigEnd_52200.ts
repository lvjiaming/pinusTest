import BaseClass from "../../../Common/script/BaseClass";
import ThirdParty from "../../../Common/script/ThirdParty";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import UserCtrl from "../../../Common/script/UserCtrl";
import { IBigEnd } from './GameClient_52200';

const {ccclass, property} = cc._decorator;

@ccclass
export default class BigEnd_52200 extends BaseClass {

    @property(cc.Node)
    layout: cc.Node = null;

    public setView(data: IBigEnd) {
        let idx = 0, paoUser = -1, paoCnt = 0, winUser = -1, winScore = 0;
        for (let i = 0; i < data.score.length; i++) {
            if (!vv.gameClient.sitUser[i]) continue;
            if (data.dianpaoCnt[i] > paoCnt) {
                paoUser = i;
                paoCnt = data.dianpaoCnt[i];
            }
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
            js.$('_labZhiMo', cc.Label).string = data.zimoCnt[i] + '';
            js.$('_labHu', cc.Label).string = data.winCnt[i] + '';
            js.$('_labDianPao', cc.Label).string = data.dianpaoCnt[i] + '';
            js.$('_labScore', cc.Label).string = data.score[i] > 0 ? ('+' + data.score[i]) : (data.score[i] + '');
            js.$('_win').active = data.score[i] > 0;
            js.$('_lose').active = data.score[i] <= 0;
            js.$('_paoShou').active = paoUser == i;
            js.$('_bigWin').active = winUser == i;
        }
    }

    _onBtReturn() {
        cc.director.loadScene('Hall');
    }

    _onBtShare() {
        ThirdParty.WXShareImage(ThirdParty.saveImage(this.node));
    }
}
