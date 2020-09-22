import BaseClass from "../../Common/script/BaseClass";
import CustomSprite from "../../Common/script/CustomSprite";
import GameRecord from "../../Hall/script/GameRecord";
import ClubRoomItem from "./ClubRoomItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ClubInfo extends BaseClass {

    clubKey: number = 0;

    onLoad() {
        this.on(['onUpdateUser', 'onUpdateRoom', 'onUpdateRequire', 'updateUserInfo', 'onLeaveClub', 'onUpdateManager']);
    }

    onUpdateUser(data: { clubKey: number, userCnt: number }) {
        if (data.clubKey != this.clubKey) return;
        this.$('_labMemberCnt', cc.Label).string = data.userCnt + '';
    }

    onUpdateRoom(data: { clubKey: number, roomInfo: any[] }) {
        if (data.clubKey != this.clubKey) return;
        this._setRoomView(data.roomInfo);
    }

    onUpdateRequire(data: { clubKey: number, require: any[] }) {
        if (data.clubKey != this.clubKey) return;
        if (vv.club.userInfo.MemberOrder > 0) {
            this.$('_red').active = data.require.length > 0;
        }
    }

    updateUserInfo(data: IClubUserInfo) {
        if (data.UserID == vv.club.userInfo.UserID) {
            vv.club.userInfo = data;
            this._setButton(data);
        }
    }

    onLeaveClub(data: { clubKey: number }) {
        if (this.clubKey != data.clubKey) return;
        this.clubKey = 0;
        this.node.active = false;
    }

    onUpdateManager(data: { clubKey: number, userInfo: IClubUserInfo }) {
        if (this.clubKey != data.clubKey) return;
        if (vv.club) {
            vv.club.userInfo = data.userInfo;
            this._setButton(data.userInfo);
        }
    }


    public async onShowView() {
        let res: IResponse = await vv.pinus.request('club.clubHandler.enter', {});
        if (res.status != 0) {
            this.showAlert(res.msg, Alert.Yes, () => {
                this.hideView();
            })
        }
        let data: {
            clubInfo: IClubBaseInfo,
            userInfo: IClubUserInfo,
            roomInfo: any[],
            required: any
        } = res.data;
        vv.club = {
            clubInfo: data.clubInfo,
            userInfo: data.userInfo,
            infoJS: this
        };
        this.clubKey = data.clubInfo.ClubKey;
        this.$('_labClubName', cc.Label).string = data.clubInfo.ClubName;
        this.$('_labClubID', cc.Label).string = data.clubInfo.ClubID + '';
        this.$('_labMemberCnt', cc.Label).string = data.clubInfo.MemberCount + '';
        this._setButton(data.userInfo);
        this.$('_red').active = data.required.length > 0;
        this._setRoomView(data.roomInfo);
    }

    _setButton(userInfo: IClubUserInfo) {
        this.$('_btSet').active = userInfo.MemberOrder == 2;
        this.$('_btRequire').active = userInfo.MemberOrder > 0;
        // this.$('_btDissClub').active = userInfo.MemberOrder == 2;
        this.$('_btDissClub', CustomSprite).index = userInfo.MemberOrder == 2 ? 0 : 1;
        this.$('_btCreateRoom').active = userInfo.MemberOrder > 0;
        this.$('_btScoreLog').active = userInfo.MemberOrder > 0;
    }

    _setRoomView(roomInfo) {
        this.$('_rooms').children.forEach(node => node.getComponent(ClubRoomItem).resetView());
        for (let info of roomInfo) {
            let js = this._getNextRoom();
            js.setView(info, info.users);
            js.m_Hook = this;
        }
    }

    async onHideView() {
        vv.club = null;
        return 0;
    }

    _getNextRoom(): ClubRoomItem {
        for (let node of this.$('_rooms').children) {
            if (!node.active) return node.getComponent(ClubRoomItem);
        }
        let node = cc.instantiate(this.$('_rooms').children[0]);
        node.parent = this.$('_rooms');
        return node.getComponent(ClubRoomItem);
    }

    _onBtRequire() {
        this.showPrefab('ClubRequire');
    }

    _onBtMember() {
        this.showPrefab('ClubMember')
    }

    _onBtCreateRoom() {
        this.showPrefab('CreateClubRoom');
    }

    _onBtScoreLog() {
        this.showPrefab('ClubScoreLog');
    }

    async _onBtDissClub() {
        let msg = '';
        if (vv.club.userInfo.MemberOrder == 2) {
            msg = '确定要解散俱乐部吗!';
        } else {
            msg = '确定要退出俱乐部吗!';
        }
        this.showAlert(msg, Alert.YesNo, async (res) => {
            if (res) {
                let route = 'club.clubHandler.dissOrExitClub';
                let ret: IResponse = await vv.pinus.request(route, {});
                g_CurScence.showAlert(ret.msg);
            }
        })
    }

    _onBtSet() {
        this.showPrefab('SetManager');
    }

    async _onBtRecord() {
        let route = 'club.clubHandler.getClubRecords';
        let ret = await vv.pinus.request(route, {});
        let js = await this.showPrefab<GameRecord>('GameRecord');
        js.setView(ret.data);
    }
}
