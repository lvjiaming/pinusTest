import ActionClass from "../../Common/script/ActionClass";
import UserCtrl from "../../Common/script/UserCtrl";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UserInfo extends ActionClass {


    public async setView(userID: number, chair?: number) {
        await this.$('_userInfo', UserCtrl).setUserByID(userID);
    }
}
