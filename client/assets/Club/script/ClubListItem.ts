import BaseClass from "../../Common/script/BaseClass";
import ClubList from "./ClubList";

const { ccclass, property } = cc._decorator;


@ccclass
export default class ClubListItem extends BaseClass {

    public clubKey: number = 0;

    public m_Hook: ClubList;

    onLoad() {
        this.on(['onUpdateUser', 'onUpdateRoom', 'onLeaveClub']);
    }

    onUpdateUser(data: { clubKey: number, userCnt: number }) {
        if (data.clubKey != this.clubKey) return;
        let str = this.$('_labUserCnt', cc.Label).string;
        this.$('_labUserCnt', cc.Label).string = data.userCnt + str.slice(str.indexOf('/')) ;
    }

    onUpdateRoom(data: { clubKey: number, roomInfo: any[] }) {
        if (data.clubKey != this.clubKey) return;
        this.$('_labTableCnt', cc.Label).string = data.roomInfo.length + '';
    }

    onLeaveClub (data: { clubKey: number }) {
        if (this.clubKey != data.clubKey) return;
        this.clubKey = 0;
        this.node.active = false;
        this.m_Hook.updateNoClub();
    }

    public setView(data: IClubBaseInfo) {
        this.$('_labClubName', cc.Label).string = data.ClubName;
        this.$('_labClubID', cc.Label).string = data.ClubID + '';
        this.$('_labUserCnt', cc.Label).string = data.MemberCount + '/' + data.MaxUserCnt;
        this.$('_labTableCnt', cc.Label).string = data.TableCnt + '';
        this.clubKey = data.ClubKey;
        this.node.active = true;
    }
}
