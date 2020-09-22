import MJCard from "./MJCard";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MJHandCard extends MJCard {

    set isTips(value: boolean) {
        this.node.getChildByName('Tips').active = value;
    }
    get isTips() {
        return this.node.getChildByName('Tips').active;
    }
}
