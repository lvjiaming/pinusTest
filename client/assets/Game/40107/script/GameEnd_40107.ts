import BaseClass from "../../../Common/script/BaseClass";
import ThirdParty from "../../../Common/script/ThirdParty";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import UserCtrl from "../../../Common/script/UserCtrl";
import CardCtrl from "../../Poker/script/CardCtrl";
import GameView from "../../Public/script/GameView";

const { ccclass, property } = cc._decorator;


@ccclass
export default class GameEnd_40107 extends BaseClass {

    @property(cc.Node)
    layout: cc.Node = null;

    onLoad() {
        this.on(['onGameStart']);
    }

    onGameStart() {
        this.node.active = false;
    }

    onGameConclude(data: { score: number[], cards: number[][], spring: number, bankUser: number }) {
        this.$('_btShare').active = cc.sys.isNative;
        this.node.active = true;
        this.$('_labMyScore', cc.Label).string = vv.gameClient.sitUser[vv.gameClient.meChairID].Score + '';
        this.layout.children.forEach(node => node.active = false);
        for (let i = 0; i < data.score.length; i++) {
            let js = this._getItem(i);
            js.$('_userInfo', UserCtrl).setUserByID(vv.gameClient.sitUser[i].UserInfo.UserID);
            js.$('_CardCtrl', CardCtrl).cards = data.cards[i];
            js.$('_labScore', cc.Label).string = this.getScoreStr(data.score[i]);
            js.$('_bank').active = data.bankUser == i;
        }
        let meScore = data.score[vv.gameClient.meChairID];
        if (meScore != 0) {
            vv.audio.playEffect(meScore > 0 ? 'win' : 'lose');
        }
    }

    private _getItem(idx: number): UIKillerClass {
        let node = this.layout.children[idx] || cc.instantiate(this.layout.children[0]);
        node.parent = this.layout;
        node.active = true;
        return node.getComponent(UIKillerClass);
    }

    private getScoreStr(score: number):string {
        if (score > 0) return '+' + score;
        else return score + '';
    }

    _onBtContinue() {
        let gameView: GameView = vv.gameClient.gameView;
        this.node.active = false;
        gameView._onBtReady();
    }

    _onBtShare() {
        ThirdParty.WXShareImage(ThirdParty.saveImage(this.node));
    }

}
