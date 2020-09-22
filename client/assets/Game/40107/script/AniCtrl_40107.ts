import BaseClass from "../../../Common/script/BaseClass";
import GameLogic_40107, { TYPE } from "./GameLogic_40107";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AniCtrl_40107 extends BaseClass {

    chair: number = -1;

    _actionAni: dragonBones.ArmatureDisplay[] = []

    onLoad() {
        this.on(['onOutCard']);
        for (let i in this.node.children) {
            this._actionAni[i] = this.node.children[i].getComponent(dragonBones.ArmatureDisplay);
            this._actionAni[i].addEventListener(dragonBones.EventObject.COMPLETE, function (i) {
                this._actionAni[i].node.active = false;
            }.bind(this, i));
        }
    }

    public onOutCard(data: { chair: number, cards: number[], first: boolean, isMax?: boolean }) {
        if (data.chair != this.chair) return;
        if (!data.first) return;
        if (vv.replay && vv.replay.isReturn) return;
        let type = GameLogic_40107.instance.getCardType(data.cards);
        switch (type) {
            case TYPE.SINGLE_LINE: {
                this.$('_line').active = true;
                this.$('_line', dragonBones.ArmatureDisplay).armatureName = 'shunzi';
                this.$('_line', dragonBones.ArmatureDisplay).playAnimation('newAnimation', 1);
                break;
            }
            case TYPE.DOUBLE_LINE: {
                this.$('_line').active = true;
                this.$('_line', dragonBones.ArmatureDisplay).armatureName = 'liandui';
                this.$('_line', dragonBones.ArmatureDisplay).playAnimation('newAnimation', 1);
                break;
            }
            case TYPE.MISSILE: {
                this.$('_king').active = true;
                this.$('_king', dragonBones.ArmatureDisplay).playAnimation('newAnimation', 1);
                break;
            }
            case TYPE.BOMB: {
                this.$('_bomb').active = true;
                this.$('_bomb', dragonBones.ArmatureDisplay).playAnimation('newAnimation', 1);
                break;
            }
            case TYPE.THREE_LINE_TAKE_ONE:
            case TYPE.THREE_LINE_TAKE_TWO: {
                this.$('_fly').active = true;
                this.$('_fly', dragonBones.ArmatureDisplay).playAnimation('newAnimation', 1);
                break;
            }
        }
    }
}
