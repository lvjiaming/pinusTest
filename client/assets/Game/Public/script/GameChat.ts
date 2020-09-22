import ActionClass from "../../../Common/script/ActionClass";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameChat extends ActionClass {

    @property(cc.SpriteAtlas)
    atlasEmoji: cc.SpriteAtlas = null;

    public static phrase: string[] = [
        "快点啊，都等到我花儿都谢谢了！",
        "怎么又断线了，网络怎么这么差啊！",
        "不要走，决战到天亮！",
        "你的牌打得也太好了！",
        "你是妹妹还是哥哥啊？",
        "和你合作真是太愉快了！",
        "大家好，很高兴见到各位！",
        "各位，真是不好意思，我得离开一会儿。",
        "不要吵了，专心玩游戏吧！"
    ];

    onLoad() {
        let idx = 0;
        for (let sp of this.atlasEmoji.getSpriteFrames()) {
            let node = this.$('_layEmoji').children[idx] || cc.instantiate(this.$('_layEmoji').children[0]);
            node.parent = this.$('_layEmoji');
            node.getChildByName('emoji').getComponent(cc.Sprite).spriteFrame = sp;
            node.active = true;
            (<any>node).customData = {
                index: idx
            };
            idx++;
        }
        idx = 0;
        for (let str of GameChat.phrase) {
            let node = this.$('_layPhrase').children[idx] || cc.instantiate(this.$('_layPhrase').children[0]);
            node.parent = this.$('_layPhrase');
            node.getChildByName('msg').getComponent(cc.Label).string = str;
            node.active = true;
            (<any>node).customData = {
                index: idx
            };
            idx++;
        }
    }

    public onBtPhrase(event: cc.Component.EventHandler) {
        this._onBtSound();
        vv.gameClient.sendFrame('onChat', {
            sign: 0,
            msg: (<any>event.target).customData.index
        });
        this.hideView();
    }

    public onBtEmoji(event: cc.Component.EventHandler) {
        this._onBtSound();
        vv.gameClient.sendFrame('onChat', {
            sign: 1,
            msg: event.target.getChildByName('emoji').getComponent(cc.Sprite).spriteFrame.name
        });
        this.hideView();
    }

    public _onBtSend() {
        let msg = this.$('_editbox', cc.EditBox).string;
        if (msg == '') {
            this.showTips('内容不能为空！');
            return;
        }
        vv.gameClient.sendFrame('onChat', {
            sign: 2,
            msg: msg
        });
        this.hideView();
    }
}
