import ActionClass from "../../Common/script/ActionClass";
import UIKillerClass from "../../Common/script/UIKillerClass";
import UserCtrl from "../../Common/script/UserCtrl";
import ClubUser from "./ClubUser";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ClubMember extends ActionClass {

    async onShowView() {
        let route = 'club.clubHandler.getClubMember';
        let ret = await vv.pinus.request(route, {});
        this._setView(ret);
    }

    _setView(data) {
        this.$('_layout').children.forEach(node => node.active = false)
        for (let info of data) {
            let js = this._getNext();
            js.node.active = true;
            js.$('_userInfo', UserCtrl).setUserByID(info.UserID);
            js.$('_labScore', cc.Label).string = info.Score;
            js.$('_btSet').active = vv.club.userInfo.MemberOrder > 0;
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

    async _onBtSet(event: cc.Component.EventHandler) {
        if (vv.club.userInfo.MemberOrder == 0) {
            this.showAlert('您已经不是管理员的请刷新');
            this.onShowView();
            return;
        }
        let js = await this.showPrefab<ClubUser>('ClubUser');
        let userJs = event.target.parent.getComponent(UIKillerClass);
        js.setView((<any>event.target.parent).customData.userID, userJs.$('_labScore', cc.Label).string);
    }

    updateUser(userID: number, score: number) {
        for (let info of this.$('_layout').children) {
            if ((<any>info).customData.userID == userID && info.active) {
                info.getComponent(UIKillerClass).$('_labScore', cc.Label).string = score + '';
                break;
            }
        }
    }
}
