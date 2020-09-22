import { shapeType } from './../../../../creator.d';
import BaseClass from "../../../Common/script/BaseClass";
import CustomSprite from "../../../Common/script/CustomSprite";
import ThirdParty from "../../../Common/script/ThirdParty";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import Setting from "../../../Hall/script/Setting";
import GameClient, { UserState } from "./GameClient";
import GameHead from "./GameHead";
import WeChatH5 from "../../../Common/script/WeChatH5";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameView extends BaseClass {

    gameClient: GameClient = null;

    gameHead: GameHead[] = [];

    onLoad() {
        let useNode = this.$('_UserNode').children;
        for (var i in useNode) {
            this.gameHead[i] = useNode[i].getComponent('GameHead');
            this.gameHead[i].m_Hook = this;
        }
        this.registVoice();
    }

    setRoomView(info: IRoomInfo, game: GameClient) {
        this.gameClient = game;
        this.$('_labRoomID', cc.Label).string = info.RoomID + '';
    }

    onEnterUser(user) {
        let view = this.gameClient.chair2View(user.ChairID);
        if (this.gameHead[view]) {
            this.gameHead[view].setUser(user);
        }
        if (user.ChairID == this.gameClient.meChairID) {
            let condition = (user.State == UserState.FREE && !user.Ready);
            this.$('_btReady').active = condition;
            this.$('_btShare').active = this.gameClient.process == 0 && condition;
        }
        this.enterView(user.ChairID, view);
    }

    enterView(chairID, viewID): void {

    }

    onUpdateProcess(process: number) {
        this.$('_labProcess', cc.Label).string = process + '/' + this.gameClient.getTotalInning();
    }

    public resetView() {

    }

    async _onBtSet() {
        var js = await this.showPrefab<Setting>('Setting');
        js.setView(1);
    }

    public async _onBtReady() {
        if (this.gameClient.bigEndData) {
            let bigEnd = await this.showPrefab<any>('BigEnd_' + this.gameClient.roomInfo.KindID);
            bigEnd.setView(this.gameClient.bigEndData);
            return;
        }
        this.resetView();
        this.gameClient.sendFrame('userReady', {});
    }

    public async _onBtChat() {
        await this.showPrefab('GameChat');
    }

    public async _onBtShare() {
        let info = {
            link: SHARE_URL,
            desc: window['GameClient_' + this.gameClient.roomInfo.KindID].getRuleStr(
                this.gameClient.roomInfo.GameRules, this.gameClient.roomInfo.ServerRules),
            title: `【房间号:${this.gameClient.roomInfo.RoomID}】`
        };
        if (cc.sys.isNative) {
            ThirdParty.WXShareUrl(info);
        } else {
            this.showPrefab('ShareTips');
        }
    }

    public async _onBtGPS() {
        await this.showPrefab(`GpsCtrl_${this.gameClient.roomInfo.KindID}`);
    }

    private registVoice() {
        let voice = this.$('_Voice');
        if (voice == null) return;
        voice.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
            this.$('_VoiceCtrl').active = true;
            cc.audioEngine.pauseAll();
            ThirdParty.statrRecord();
        }, this);
        voice.on(cc.Node.EventType.TOUCH_CANCEL, (event: cc.Event.EventTouch) => {
            this.stopRecord();
        }, this);
        voice.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            let str = this.stopRecord();
            if (str == 'wait') return;
            if (str === undefined || str == '') {
                this.showTips('录制时间过短!');
                return;
            }
            vv.gameClient.sendFrame('onChat', {
                sign: 3,
                msg: str
            });
        }, this);
    }

    public stopRecord() {
        this._playVoiceBlock();
        let str = ThirdParty.stopRecord();
        cc.audioEngine.resumeAll();
        this.$('_VoiceCtrl').active = false;
        return str;
    }

    private _playVoiceBlock() {
        let voice = this.$('_Voice');
        if (voice == null) return;
        let block = voice.children[0];
        if (block == null) return;
        block.active = true;
        block.getComponent(cc.ProgressBar).progress = 1;
        this.schedule(function () {
            block.getComponent(cc.ProgressBar).progress -= 1 / 100;
            if (block.getComponent(cc.ProgressBar).progress <= 0) {
                block.active = false;
            }
        }, 1 / 100, 100);
    }

    @property(cc.Prefab)
    magicNode: cc.Prefab = null;

    _aniName: string[] = ['rose', 'beer', 'egg', 'shot', 'bomb'];

    // 头像父节点一定为(0, 0),或者未GameView 否者请转换坐标
    playMagicEmoji(sendView: number, acceptView: number, index: number) {
        if (this.magicNode == null) return;
        let node = cc.instantiate(this.magicNode);
        node.parent = this.node;
        let js = node.getComponent(UIKillerClass);
        node.setPosition(this.gameHead[sendView].node.getPosition());
        js.$('_sp', CustomSprite).index = index;
        js.$('_sp').active = true;
        node.runAction(cc.sequence(cc.moveTo(0.5, this.gameHead[acceptView].node.getPosition()),
            cc.callFunc(() => {
                js.$('_sp').active = false;
                let ani = js.$('_ani', dragonBones.ArmatureDisplay);
                ani.node.active = true;
                ani.armatureName = this._aniName[index];
                ani.addEventListener(dragonBones.EventObject.COMPLETE, () => {
                    node.destroy();
                })
                ani.playAnimation('newAnimation', -1);
                vv.audio.playEffect(this._aniName[index]);
            }, this)));
    }

    // update (dt) {}
}
