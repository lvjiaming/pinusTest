import GameView from "../../Public/script/GameView";
import GpsCtrl from "../../Public/script/GpsCtrl";
import AniCtrl_40107 from "./AniCtrl_40107";
import BackCard_40107 from "./BackCard_40107";
import GameHead_40107 from "./GameHead_40107";
import HandCard_40107 from "./HandCard_40107";
import OperateCtrl_40107 from "./OperateCtrl_40107";
import OutCard_40107 from "./OutCard_40107";
import SendCard_40107 from "./SendCard_40107";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameView_40107 extends GameView {

    gameHead: GameHead_40107[];

    get sendCtrl() {
        return this.$('_SendCard', SendCard_40107);
    }

    private _handCtrl: HandCard_40107[] = [];
    get handCtrl() {
        if (this._handCtrl.length == 0) {
            for (let i in this.$('_HandCard').children) {
                this._handCtrl[i] = this.$('_HandCard').children[i].getComponent(HandCard_40107);
            }
        }
        return this._handCtrl;
    }

    private _outCtrl: OutCard_40107[] = [];
    get outCtrl() {
        if (this._outCtrl.length == 0) {
            for (let i in this.$('_OutCard').children) {
                this._outCtrl[i] = this.$('_OutCard').children[i].getComponent(OutCard_40107);
            }
        }
        return this._outCtrl;
    }
    private _aniCtrl: AniCtrl_40107[] = [];
    get aniCtrl(): AniCtrl_40107[] {
        if (this._aniCtrl.length == 0) {
            for (let i in this.$('_Ani').children) {
                this._aniCtrl[i] = this.$('_Ani').children[i].getComponent(AniCtrl_40107);
            }
        }
        return this._aniCtrl;
    }
    get backCtrl(): BackCard_40107 {
        return this.$('_backCard', BackCard_40107);
    }

    get operateCtrl() {
        return this.$('_ButtonCtrl', OperateCtrl_40107);
    }

    onLoad() {
        super.onLoad();
    }

    enterView(chairID, viewID): void {
        this.handCtrl[viewID].chair = chairID;
        this.outCtrl[viewID].chair = chairID;
        this.aniCtrl[viewID].chair = chairID;
        if (chairID == vv.gameClient.meChairID) {
            this.operateCtrl.chair = chairID;
        }
        this.$('_warn', cc.Toggle).isChecked = GpsCtrl.isWarn(vv.gameClient.sitUser);
    }

    resetView() {
        this.handCtrl.forEach(js => js.resetView());
        this.outCtrl.forEach(js => js.resetView());
        this.operateCtrl.resetView();
        this.gameHead.forEach(js => js.resetView());
        let end = this.m_loadPrefab['GameEnd_40107'];
        if (end && end.active) {
            end.active = false;
        }
        this.backCtrl.resetView();
    }

}
