import BaseClass from "../../../Common/script/BaseClass";
import { IBaseCard } from './../../52200/script/GameClient_52200';
import { INVALID_CHAIR } from './../../Public/script/GameClient';
import WeaveItem, { IWeaveItem } from "./WeaveItem";

const {ccclass, property} = cc._decorator;


@ccclass
export default class WeaveCtrl extends BaseClass {

    @property
    isTurn: boolean = false;
    _weaveItems: WeaveItem[] = [];
    get weaveItems() {
        if (this._weaveItems.length === 0) {
            for (let i in this.node.children) {
                let item = this.node.children[i].getComponent(WeaveItem);
                if (this.isTurn) {
                    this._weaveItems[this.node.children.length - parseInt(i) - 1] = item;
                } else {
                    this._weaveItems[i] = item;
                }
            }
        }
        return this._weaveItems;
    }

    _chair: number = INVALID_CHAIR;
    set chair (value: number) {
        if (this._chair == INVALID_CHAIR) {
            this._chair = value;
            this.weaveItems.forEach(item => {
                item.meChairID = value;
            });
            this.on(['onBaseCard']);   
        }
    }
    
    onBaseCard(data: IBaseCard) {
        this.setWeaveItems(data.weaveItem[this._chair]);
    }

    setWeaveItems(weaves: IWeaveItem[]) {
        if (!weaves) return;
        for (let i in this.weaveItems) {
            let item = weaves[i];
            this.weaveItems[i].node.active = !!item;
            if (item) {
                this.weaveItems[i].setWeave(item);
            }
        }
    }

    resetView() {
        this.weaveItems.forEach(item => {item.node.active = false});
    }
}
