import BaseClass from "../../Common/script/BaseClass";
import UIKillerClass from "../../Common/script/UIKillerClass";
import UserCtrl from "../../Common/script/UserCtrl";

const {ccclass, property} = cc._decorator;

interface IClubScoreLog {
    SrcUserID: number;
    DstUserID: number;
    SwapScore: number;
    CreateTime: string;
}

@ccclass
export default class ClubScoreLog extends BaseClass {

    logInfo: IClubScoreLog[] = [];

    async onShowView() {
        let route = 'club.clubHandler.getScoreLog';
        let ret: IClubScoreLog[] = await vv.pinus.request(route, {});
        this.logInfo = ret;
        this._updateView();
    }

    _updateView() {
        this.$('_layout').children.forEach(node => node.active = false);
        let idx = 0;
        let total = 0;
        let now = new Date();
        now.setDate(now.getDate() - 1);
        for (let info of this.logInfo) {
            if (info.SwapScore > 0 && this.$('_btUp', cc.Toggle).isChecked ||
                info.SwapScore < 0 && this.$('_btDown', cc.Toggle).isChecked) {
                let node = this.$('_layout').children[idx++] || cc.instantiate(this.$('_layout').children[0]);
                node.parent = this.$('_layout');
                let js = node.getComponent(UIKillerClass);
                js.$('_user', UserCtrl).setUserByID(info.SrcUserID);
                js.$('_tag', UserCtrl).setUserByID(info.DstUserID);
                js.$('_labScore', cc.Label).string = Math.abs(info.SwapScore) + '';
                js.$('_labTime', cc.Label).string = info.CreateTime;
                let data = new Date(info.CreateTime);
                if (now.getDate() == data.getDate()) {
                    total += Math.abs(info.SwapScore);
                }
                node.active = true;
            }
        }
        this.$('_labTotalUp', cc.Label).string = total + '';
    }

    _onBtUp() {
        this.$('_btUp', cc.Toggle).isChecked = true;
        this._updateView();
    }

    _onBtDown() {
        this.$('_btDown', cc.Toggle).isChecked = true;
        this._updateView();
    }
}
