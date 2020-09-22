import BaseClass from "../../Common/script/BaseClass";
import CustomSprite from "../../Common/script/CustomSprite";
import UserCtrl from "../../Common/script/UserCtrl";

const { ccclass, property } = cc._decorator;


@ccclass
export default class ClubRoomItem extends BaseClass {

    private roomID: number = 0;

    onLoad() {
        this.on(['onUpdateRoomInfo']);
    }

    onUpdateRoomInfo(data: any) {
        let info: IRoomInfo = data, users: ITableUser[] = data.users;
        if (info.RoomID != this.roomID) return;
        this.setView(info, users);
    }

    setView(data: IRoomInfo, users: ITableUser[]) {
        if (typeof data.GameRules == 'string') data.GameRules = JSON.parse(data.GameRules);
        this.roomID = data.RoomID;
        // this.$('_game').active = data.Process > 0;
        // this.$('_wait').active = data.Process == 0;
        this.node.active = true;
        let nodeUser = this.$('_users').children, empty = this.$('_empty').children;
        let sitCnt = 0, leftCnt = window['GameClient_' + data.KindID].getPlayerCnt(data.GameRules);
        empty.forEach(node => node.active = false);
        for (let i in nodeUser) {
            nodeUser[i].active = !!users[i];
            if (!!users[i]) {
                nodeUser[i].getComponent(UserCtrl).setUserByID(users[i].UserInfo.UserID);
                sitCnt++;
            }
        }
        if (leftCnt == 2) {
            empty[0].active = !nodeUser[0].active;
            empty[2].active = !nodeUser[2].active;
        } else {
            leftCnt -= sitCnt;
            for (let i in empty) {
                if (leftCnt <= 0) break;
                if (nodeUser[i].active) continue;
                empty[i].active = true;
                leftCnt--;
            }
        }
        this.$('_labKindName', cc.Label).string = data.KindID == 40107 ? '斗地主' : '宝清麻将';
        this.$('_labRule', cc.Label).string = window['GameClient_' + data.KindID].getRuleStr(data.GameRules, data.ServerRules);
        this.$('_btEnterRoom', CustomSprite).index = data.KindID == 40107 ? 1 : 0;
    }

    async _onBtEnterRoom() {
        const route = 'hall.roomHandler.joinRoom';
        const res = await vv.pinus.request(route, { roomID: this.roomID });
        if (res.status != 0) {
            await this.m_Hook.showAlert(res.msg);
            return;
        }
        vv.roomInfo = res.data;
        cc.director.loadScene(vv.roomInfo.KindID + '')
    }

    async _onBtDissRoom() {
        this.m_Hook.showAlert('确定要解散该房间吗?', Alert.YesNo, async (ret) => {
            if (!ret) return;
            const route = 'club.clubHandler.dissClubRoom';
            const res: IResponse = await vv.pinus.request(route, {
                roomID: this.roomID,
                force: false
            });
            await this.m_Hook.showAlert(res.msg);
        })
    }

    onBtInfo() {
        let node = this.$('_labRule').parent;
        node.active = !node.active;
    }

    public resetView() {
        this.roomID = 0;
        this.node.active = false;
    }
}
