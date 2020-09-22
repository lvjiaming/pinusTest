import BaseClass from "../../Common/script/BaseClass";
import CustomSprite from "../../Common/script/CustomSprite";
import UserCtrl from "../../Common/script/UserCtrl";
import CreateRoom from "./CreateRoom";
import GameRecord from "./GameRecord";
import Setting from "./Setting";
import UserInfo from "./UserInfo";
import WeChatH5 from "../../Common/script/WeChatH5";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Hall extends BaseClass {

    // LIFE-CYCLE CALLBACKS:

    async onLoad() {
        this.node.scaleY = cc.view.getVisibleSize().height / SCENE_HEIGHT;
        (<any>window).g_CurScence = this;
        if (!vv.userInfo || !vv.userInfo.UserID) {
            cc.director.loadScene('Start');
            return;
        }
        this.$('_UserInfo', UserCtrl).setUserByID(vv.userInfo.UserID);
        vv.audio.playMusic('BGM');
        this.on(['onUpdateRoomCard'])
        await this.enter();
        if (cc.sys.isBrowser) {
            WeChatH5.setShareInfo({
                title: '【乐友宝清】',
                desc: '能否与我一战！'
            });
        }
    }

    async enter() {
        var route = 'hall.hallHandler.enter';
        var res: IResponse = await vv.pinus.request(route, {});
        if (res.status != 0) cc.director.loadScene('Start');
        this.$('_labCard', cc.Label).string = res.data.RoomCard;
        if (vv.club && vv.club.infoJS) {
            let js: BaseClass = vv.club.infoJS;
            if (js.node && js.node.active && vv.club.clubInfo && vv.club.clubInfo.ClubKey) {
                let res = await vv.pinus.request('hall.hallClubHandler.enterClub', {
                    clubKey: vv.club.clubInfo.ClubKey
                });
                js.onShowView();
            }
        }
    }


    onUpdateRoomCard(card) {
        this.$('_labCard', cc.Label).string = card;
    }

    public async onShareRes() {
        if (vv.pinus.connected) {
            const route = 'hall.hallHandler.shareGive';
            const res: IResponse = await vv.pinus.request(route, {});
            if (res.status != 0) {
                // this.showAlert(res.msg);
                return;
            }
            this.showAlert(res.msg);
        } else {
            setTimeout(this.onShareRes.bind(this), 200);
        }
    }

    //////////////////////////////////////////////////////////////// 点击事件
    private async _onBtRecruit() {
        var js = await this.showPrefab<BaseClass>('CustomerService');
        js.$('_title', CustomSprite).index = 0;
    }

    private async _onBtShop() {
        var js = await this.showPrefab<BaseClass>('CustomerService');
        js.$('_title', CustomSprite).index = 1;
    }

    private async _onBtAddCard() {
        var js = await this.showPrefab<BaseClass>('CustomerService');
        js.$('_title', CustomSprite).index = 1;
    }

    private async _onBtCreateRoom() {
        var js = await this.showPrefab<CreateRoom>('CreateRoom');
    }

    private async _onBtJoinRoom() {
        await this.showPrefab('JoinRoom');
    }

    private async _onBtSetting() {
        var js = await this.showPrefab<Setting>('Setting');
        js.setView(0);
    }

    private async _onBtRecord() {
        var route = 'hall.hallHandler.getGameRecord';
        var res = await vv.pinus.request(route, {});
        let js = await this.showPrefab<GameRecord>('GameRecord');
        js.setView(res.data)
    }

    private async _onBtClub() {
        this.showPrefab('ClubList');
    }

    private async _onBtNotice() {
        this.showPrefab('Notice');
    }

    private async _onBtRules() {
        this.showPrefab('Rules');
    }

    private async _onBtShare() {
        this.showPrefab('ShareDlg');
    }

    private async _onBtUser() {
        let js = await this.showPrefab<UserInfo>('UserInfo')
        await js.setView(vv.userInfo.UserID);
    }

    // update (dt) {}
}
