import BaseClass from "../../../Common/script/BaseClass";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import MJCard from "./MJCard";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ListenTips extends BaseClass {

    setView(data: { [key: number]: { cnt: number } }) {
        let cnt = 0;
        this.$('_layout').children.forEach(node => node.active = false);
        for (let key in data) {
            let node = this.$('_layout').children[cnt++] || cc.instantiate(this.$('_layout').children[0]);
            node.parent = this.$('_layout');
            let js = node.getComponent(UIKillerClass);
            js.$('_MJCard', MJCard).card = parseInt(key);
            js.$('_labCnt', cc.Label).string = data[key].cnt + '张';
            node.active = true;
        }
        this.$('_labTotal', cc.Label).string = cnt + '';
    }
}
