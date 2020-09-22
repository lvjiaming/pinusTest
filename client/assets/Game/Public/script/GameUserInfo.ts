import UserInfo from "../../../Hall/script/UserInfo";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameUserInfo extends UserInfo {

    chair: number = -1;
 
    public async setView(userID: number, chair: number) {
        super.setView(userID);
        this.chair = chair;
    }

    _onBtEmoji(event: cc.Component.EventHandler, data: string) {
        vv.gameClient.sendFrame('onChat', {
            sign: 4,
            msg: data,
            toChair: this.chair
        });
        this.hideView();
    }
}
