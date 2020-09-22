import ActionClass from "../../Common/script/ActionClass";
import UIKillerClass from "../../Common/script/UIKillerClass";
import UserCtrl from "../../Common/script/UserCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ClubRequire extends ActionClass {

    async onShowView() {
        let route = 'club.clubHandler.getClubRequire';
        let ret = await vv.pinus.request(route, {});
        this._setView(ret);
    }

    _setView(data) {
        this.m_Hook.$('_red').active = data.length > 0;
        this.$('_layout').children.forEach(node => node.active = false)
        for (let info of data) {
            let js = this._getNext();
            js.node.active = true;
            js.$('_userInfo', UserCtrl).setUserByID(info.UserID);
            (<any>js.node).customData = {
                userID: info.UserID
            }
        }
    }

    _getNext() {
        let cnt = 0;
        this.$('_layout').children.forEach(node => {
            if (node.active) cnt++;
        })
        let node = this.$('_layout').children[cnt] || cc.instantiate(this.$('_layout').children[0]);
        node.parent = this.$('_layout');
        return node.getComponent(UIKillerClass);
    }

    _onBtAccept(event: cc.Component.EventHandler) {
        this._sendRequire((<any>event.target.parent).customData.userID, true);
    }

    _onBtRefuse(event: cc.Component.EventHandler) {
        this._sendRequire((<any>event.target.parent).customData.userID, false);
    }

    _onBtAllAccept() {
        this._sendRequire(0, true);
    }

    _onBtAllRefuse() {
        this._sendRequire(0, false);
    }

    async _sendRequire(userID: number, isAgree: boolean) {
        let ret:IResponse = await vv.pinus.request('club.clubHandler.doRequire', {
             userID: userID,
             isAgree: isAgree          
        });
        if (ret.status != 0) {
            this.showAlert(ret.msg);
        } else {
            this._setView(ret.data);
        }
    }
}
