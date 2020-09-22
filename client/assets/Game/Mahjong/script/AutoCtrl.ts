import BaseClass from "../../../Common/script/BaseClass";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import MJCard from "./MJCard";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AutoCtrl extends BaseClass {

    public set isAuto(value) {
        this.$('_btAuto', cc.Toggle).isChecked = value;
    }
    public get isAuto (): boolean {
        return this.$('_btAuto', cc.Toggle).isChecked;
    }

    onLoad() {
        this.node.active = false
        this.on(['updateAutoTips']);
    }

    updateAutoTips(data: { [key: number]: number }) {
        let condition = JSON.stringify(data) != '{}';
        this.node.active = condition;
        if (!condition) {
            this.isAuto = false;
        }
        let cnt = 0;
        for (let key in data) {
            let node = this.$('_layout').children[cnt++] || cc.instantiate(this.$('_layout').children[0]);
            node.parent = this.$('_layout');
            let js = node.getComponent(UIKillerClass);
            js.$('_MJCard', MJCard).card = parseInt(key);
            js.$('_labCnt', cc.Label).string = 'x' + data[key];
            node.active = true;
            this.node.active = true;
        }
        if (this.$('_layout').children.length > cnt) {
            for (let i = cnt; i < this.$('_layout').children.length; i++) {
                this.$('_layout').children[i].active = false;
            }
        }
    }

}
