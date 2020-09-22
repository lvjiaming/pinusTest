import BaseClass from "../../../Common/script/BaseClass";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import UserCtrl from "../../../Common/script/UserCtrl";

const { ccclass, property } = cc._decorator;

interface IDissRoom {
    applyUser: number;
    state: boolean[];
    endTime: number;
}

@ccclass
export default class DissGame extends BaseClass {

    @property(cc.Node)
    layout: cc.Node = null;

    private users: UIKillerClass[] = [];

    private leftTime: number = 0;

    onLoad() {
        this.schedule(() => {
            if (this.leftTime != 0) {
                this.leftTime--;
                this.$('_labTime', cc.Label).string = this.leftTime + '';
            }
        }, 1);
        this.on(['onDissRoom', 'onDissRoomRes']);
    }

    public setView(data: IDissRoom) {
        this.$('_labTime').active = !vv.replay
        this.users = [];
        let idx = 0;
        this.layout.children.forEach(node => node.active = false);
        for (let i in vv.gameClient.sitUser) {
            let user = vv.gameClient.sitUser[i];
            if (!user) continue;
            if (data.applyUser == user.UserInfo.UserID) {
                this.$('_msg', cc.Label).string = `【${user.UserInfo.NickName}】申请解散房间，请等待其他玩家选择`;
                continue;
            }
            let node = this.layout.children[idx++];
            if (node) {
                node.active = true;
                node.getComponent(UserCtrl).setUserByID(user.UserInfo.UserID);
                this.users[user.ChairID] = node.getComponent(UIKillerClass);
            }
        }
        this.leftTime = Math.floor((data.endTime - Date.now()) / 1000);
        this.onDissRoom(data);
    }

    onDissRoom(data: IDissRoom) {
        for (let i in this.users) {
            let state = data.state[i];
            this.users[i].$('_wait').active = state == null;
            this.users[i].$('_refuse').active = state == false;
            this.users[i].$('_agree').active = state == true;
        }
        this.$('_btRefuse').active = !data.state[vv.gameClient.meChairID]
        this.$('_btAgree').active = !data.state[vv.gameClient.meChairID];
    }

    onDissRoomRes(data: IResponse) {
        this.leftTime = 0;
        this.node.active = false;
        let gameView = vv.gameClient.gameView;
        gameView.showAlert(data.msg);
    }

    _onBtAgree() {
        vv.gameClient.sendFrame('updateDissRoom', true);        
    }

    _onBtRefuse() {
        vv.gameClient.sendFrame('updateDissRoom', false); 
    }
}
