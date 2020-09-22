import BaseClass from "../../../Common/script/BaseClass";
import UserCtrl from "../../../Common/script/UserCtrl";
import GameChat from "./GameChat";
import { INVALID_CHAIR, UserState } from "./GameClient";
import GameUserInfo from "./GameUserInfo";
import GameView from "./GameView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameHead extends BaseClass {

    // LIFE-CYCLE CALLBACKS:

    userID: number = 0;
    chair: number = INVALID_CHAIR;
    m_Hook: GameView;

    @property
    set isBanker(value: boolean) {
        this.$('_bank').active = value;
    }

    onLoad() {
        this.node.active = false;
        this.on(['onLeaveUser', 'onChat']);
        this.$('_emoji', dragonBones.ArmatureDisplay).addEventListener(dragonBones.EventObject.COMPLETE, () => {
            this.$('_emoji').active = false;
        })
    };


    public setUser(user: ITableUser) {
        this.resetView();
        this.$('_UserInfo', UserCtrl).setUserByID(user.UserInfo.UserID);
        this.$('_labScore', cc.Label).string = user.Score + '';
        this.$('_ok').active = user.State == UserState.FREE && user.Ready
        this.$('_offline').active = user.Offline;
        this.node.active = true;
        this.userID = user.UserInfo.UserID;
        this.chair = user.ChairID;
    }

    onLeaveUser(userID: number) {
        if (userID == this.userID) {
            this.node.active = false;
            this.userID = 0;
        }
    }

    // sign 0快捷短语 1表情 2自定义短语 3语音 4魔法表情
    onChat(data: IChatInfo) {
        if (this.chair != data.chairID) return;
        if (data.sign == 3) return;
        if (data.sign == 4) return;
        if (data.sign == 1) {
            this.$('_emoji').active = true;
            let ani = this.$('_emoji', dragonBones.ArmatureDisplay);
            ani.armatureName = data.msg;
            ani.playAnimation('newAnimation', -1);
        } else {
            let str = data.sign == 0 ? GameChat.phrase[data.msg] : data.msg;
            if (str.length > 15) {
                let temp = '';
                for (let i = 0; i < Math.floor(str.length / 15) + (str % str.length == 0 ? 0 : 1); i++) {
                    if (str.length <= (i + 1) * 15) {
                        temp += str.slice(i * 15);
                    } else {
                        temp += str.slice(i * 15, (i + 1) * 15);
                        temp += '\r\n';
                    }
                }
                str = temp;
                console.log(str);
            }
            this.$('_phrase').active = true;
            this.$('_phrase', cc.Label).string = str;
            this.$('_phrase').getChildByName('label').getComponent(cc.Label).string = str;
            if (data.sign == 0) {
                vv.audio.playEffect('phrase' + data.msg);
            }
            this.unschedule(this._hidePhrase);
            this.scheduleOnce(this._hidePhrase, 3)
        }
    }

    private _hidePhrase() {
        this.$('_phrase').active = false;
    }

    public async _onBtUser() {
        if (!this.userID) return;
        let js = await this.m_Hook.showPrefab<GameUserInfo>('GameUserInfo');
        await js.setView(this.userID, this.chair);
    }

    public resetView() {
        this.$('_ok').active = false;
        this.$('_offline').active = false;
        // this.$('_bank').active = false;
        this.$('_emoji').active = false;
        this.$('_phrase').active = false;
    }

    // update (dt) {}
}
