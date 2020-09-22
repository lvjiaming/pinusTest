import BaseClass from "../../../Common/script/BaseClass";
import HandCtrl from "./HandCtrl";
import WeaveItem from "./WeaveItem";

const { ccclass, property } = cc._decorator;

interface IOperateNotify {
    actionMask: number;
    centerCard: number;
    cards: number[];
}

interface IUserOperate {
    index: number;
}

export const WIK = {
    NULL: 0x0000,
    LEFT: 0x0001,
    CENTER: 0x0002,
    RIGHT: 0x0004,
    PENG: 0x0008,
    GANG: 0x0010,
    LISTEN: 0x0020,
    CHI_HU: 0x0040,
}

const sign = {
    1: 'an_chi',
    2: 'an_chi',
    4: 'an_chi',
    8: 'an_peng',
    16: 'an_gang',
    32: 'an_ting',
    64: 'an_hu'
}



@ccclass
export default class OperateCtrl extends BaseClass {

    @property(cc.SpriteAtlas)
    sprite: cc.SpriteAtlas = null;

    handCtrl: HandCtrl;

    get autoCtrl () {
        return this.handCtrl.autoCtrl;
    }

    onLoad() {
        this.on(['onOperateNotice']);
        this.node.active = false;
    }

    onOperateNotice(data: IOperateNotify[]) {
        this.node.active = data.length > 0;
        this.showOperate(data);
    }

    showOperate(res: IOperateNotify[]) {
        let layout = this.node.getChildByName('layout');
        layout.children.forEach(node => {
            node.active = false;
        });
        let cnt = 0;
        for (let i in res) {
            // 此游戏没有听
            if (res[i].actionMask == WIK.LISTEN) {
                this.handCtrl.setListenTips(res[i].cards);
                if (res.length == 1) this.node.active = false;
                continue;
            }
            if (this.autoCtrl.node.active && this.autoCtrl.isAuto) {
                this.handCtrl.stopAuto = true;
            }
            let node = layout.children[cnt++] || cc.instantiate(layout.children[0]);
            node.parent = layout;
            node.getChildByName('bg').active = (res[i].actionMask & (WIK.LISTEN | WIK.CHI_HU)) == 0;
            node.getChildByName('sign').getComponent(cc.Sprite).spriteFrame = this.sprite.getSpriteFrame(sign[res[i].actionMask]);
            let weave = node.getComponentInChildren(WeaveItem);
            weave.setCards(res[i].cards, res[i].centerCard, res[i].actionMask);
            node.active = true;
            let anyNode: any = node
            anyNode.customData = {
                index: parseInt(i),
                cards: res[i].actionMask == WIK.LISTEN ? res[i].cards : null
            }
        }
    }

    _onBtOperate(event: cc.Component.EventHandler) {
        this.autoCtrl.isAuto = false;
        let anyNode: any = event.target;
        vv.gameClient.sendGame('onOperate', {
            index: anyNode.customData.index
        } as IUserOperate);
        if (anyNode.customData.cards) {
            this.handCtrl.setListenCard(anyNode.customData.cards);
        }
    }

    _onBtGuo() {
        vv.gameClient.sendGame('onOperate', {
            index: -1
        } as IUserOperate);
        this.handCtrl.stopAuto = false;
    }
}
