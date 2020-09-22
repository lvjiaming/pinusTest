import ActionClass from "../../Common/script/ActionClass";
import CustomSlider from "../../Common/script/CustomSlider";
import CustomSprite from '../../Common/script/CustomSprite';
import GameClient from "../../Game/Public/script/GameClient";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Setting extends ActionClass {

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.$('_sliderMusic', CustomSlider).progress = cc.audioEngine.getMusicVolume();
        this.$('_sliderSound', CustomSlider).progress = cc.audioEngine.getEffectsVolume();
    }

    // 0:大厅 1:游戏
    setView(view?: number) {
        if (view == null) view = 0;
        this.$('_btExit').active = (view == 0) && cc.sys.browserType != cc.sys.BROWSER_TYPE_WECHAT;
        this.$('_btDiss').active = view == 1;
        if (view == 1) {
            var gameClient: GameClient = this.m_Hook.gameClient;
            var condition = gameClient.process > 0 || (gameClient.roomInfo.CreatorID == vv.userInfo.UserID && gameClient.roomInfo.ClubKey == 0)
            this.$('_btDiss', CustomSprite).index = condition ? 0 : 1;
        }
    }

    _onBtDiss() {
        var gameClient: GameClient = this.m_Hook.gameClient;
        gameClient.dissGame();
        this.hideView();
    }

    _onBtExit() {
        cc.sys.localStorage.setItem(GAME_NAME + "userAcc", '');
        cc.sys.localStorage.setItem(GAME_NAME + "userPsw", '');
        cc.sys.localStorage.setItem(GAME_NAME + "userMD5Psw", '');
        g_isHide = true;
        vv.pinus.disconnect();
        cc.director.loadScene('Start');
    }

    onSlideMusic() {
        let value = this.$('_sliderMusic', CustomSlider).progress;
        vv.audio.setMusicVolume(value);
    }

    onSlideSound() {
        let value = this.$('_sliderSound', CustomSlider).progress;
        vv.audio.setEffectVolume(value);
    }

    // update (dt) {}
}
