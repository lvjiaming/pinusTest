import BaseClass from "../../../Common/script/BaseClass";
import CardCtrl from "../../Poker/script/CardCtrl";
import CardLayout from "../../Poker/script/CardLayout";
import GameLogic_40107 from "./GameLogic_40107";
import PokerCard_40107 from "./PokerCard_40107";

const { ccclass, property } = cc._decorator;

@ccclass
export default class OutCard_40107 extends BaseClass {

    public chair: number = -1;

    public bankUser: number = -1;

    get cardCtrl(): (CardCtrl | CardLayout) {
        return this.node.getComponent(CardCtrl) || this.node.getComponent(CardLayout);
    }

    onLoad() {
        this.on(['onOutCard', 'onSureBank']);
    }

    public onOutCard(data: { chair: number, cards: number[], first: boolean, isMax?: boolean }) {
        if (data.chair != this.chair) return;
        this.cardCtrl.cards = data.cards;
        if (this.bankUser == this.chair) {
            this.cardCtrl.pokers.forEach((js: PokerCard_40107) => js.isBank = true);
        }
        if (data.first) {
            this.playSound(data.cards, data.isMax);
        }
    }

    onSureBank(data: { backCard: number[], bankUser: number, first: boolean }) {
        this.bankUser = data.bankUser;
    }

    public resetView() {
        this.cardCtrl.cards = [];
    }

    playSound(cards: number[], isMax?: boolean) {
        if (cards.length == 0) return;
        let type = GameLogic_40107.instance.getCardType(cards);
        let name = vv.gameClient.getGender(this.chair);
        if (type > 2) {
            if (!isMax) name += 'DaNi';
            else name += 'Type' + type;
        } else if (type == 2) {
            name += '2_' + GameLogic_40107.instance.getLogicValue(cards[0]);
        } else if (type == 1) {
            name += '1_' + GameLogic_40107.instance.getLogicValue(cards[0]);
        }
        vv.audio.playEffect(name);
    }
}
