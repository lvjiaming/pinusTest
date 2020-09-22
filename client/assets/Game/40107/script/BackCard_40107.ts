import BaseClass from "../../../Common/script/BaseClass";
import CardCtrl from "../../Poker/script/CardCtrl";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BackCard_40107 extends BaseClass {

    onLoad() {
        this.on(['onSureBank'])
    }

    onSureBank (data: {backCard: number[]}) {
        this.node.getComponent(CardCtrl).cards = data.backCard;
    }

    resetView() {
        this.node.getComponent(CardCtrl).cards = [0, 0, 0];
    }
}
