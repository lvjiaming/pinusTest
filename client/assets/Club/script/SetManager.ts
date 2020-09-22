import ActionClass from "../../Common/script/ActionClass";
import UIKillerClass from "../../Common/script/UIKillerClass";
import UserCtrl from "../../Common/script/UserCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SetManager extends ActionClass {

    async onShowView() {
        let route = 'club.clubHandler.getClubMember';
        let ret = await vv.pinus.request(route, {});
        this._setView(ret);
    }

    _setView(data: IClubUserInfo[]) {
        let idx = 0;
        let layout = this.$('_layout');
        layout.children.forEach(node => node.active = false);
        for (let info of data) {
            if (info.MemberOrder == 1) {
                let node = layout.children[idx++] || cc.instantiate(layout.children[0]);
                node.parent = layout;
                node.active = true;
                let js = node.getComponent(UIKillerClass);
                js.$('_userInfo', UserCtrl).setUserByID(info.UserID);
                (<any>node).customData = {
                    userID: info.UserID
                }
            }
        }
    }

    _onBtDel(event: cc.Component.EventHandler) {
        this.showAlert('确定撤销该玩家管理权限?', Alert.YesNo, (res) => {
            if (res) {
                let node:any = event.target.parent;
                this._setManager(node.customData.userID, false, false);
            }
        });
    }

    async _onBtAdd() {
        let gameID = this.$('_editID', cc.EditBox).string
        if (gameID == '' || gameID.length != 6) {
            this.showTips('请输入正确的玩家ID');
            return;
        }
        await this._setManager(parseInt(gameID), true, true);
        this.$('_editID', cc.EditBox).string = '';
    }

    async _setManager(userID: number, state: boolean, isGameID: boolean) {
        let route = 'club.clubHandler.setUserManager';
        let ret = await vv.pinus.request(route, {
            userID: userID,
            state: state,
            isGameID: isGameID
        });
        if (ret.status != 0) {
            this.showAlert(ret.msg);
            return;
        } else {
            this.showAlert('设置成功!');
        }
        this._setView(ret.data);
    }
}
