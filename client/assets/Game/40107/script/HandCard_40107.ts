import BaseClass from "../../../Common/script/BaseClass";
import CardCtrl from "../../Poker/script/CardCtrl";
import TouchPoker from "../../Poker/script/TouchPoker";
import PokerCard_40107 from "./PokerCard_40107";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HandCard_40107 extends BaseClass {

    chair: number = -1;

    get cardCtrl() {
        return this.node.getComponent(CardCtrl);
    }

    onLoad() {
        this.on(['onUpdateCard', 'onSureBank']);
    }

    onUpdateCard(data: { chair: number, cards: number[] }) {
        if (this.chair != data.chair) return;
        this.cardCtrl.cards = data.cards;
        this.node.getComponent(TouchPoker).shootCards = [];
    }

    onSureBank(data: { backCard: number[], bankUser: number, first: boolean }) {
        if (vv.gameClient.meChairID == this.chair && this.chair == data.bankUser && data.first) {
            this.node.getComponent(TouchPoker).shootCards = data.backCard;
        }
        if (this.chair == data.bankUser) {
            this.cardCtrl.pokers.forEach((js: PokerCard_40107) => js.isBank = true);
        }
    }

    resetView() {
        this.cardCtrl.cards = [];
    }
}
