import PokerCard from "./PokerCard";
import CardCtrl from "./CardCtrl";

const {ccclass, property} = cc._decorator;

const MAX_CNT = 10;
@ccclass
export default class CardLayout extends cc.Component {

    @property(CardCtrl)
    lineCard: CardCtrl[] = [];

    _cards: number[] = [];
    set cards(cards: number[]) {
        this._cards = cards;
        let lineCnt = Math.ceil(cards.length / MAX_CNT);
        for (let i = 0; i < this.lineCard.length; i++) {
            if (i >= lineCnt) {
                this.lineCard[i].node.active = false;
            } else {
                this.lineCard[i].node.active = true;
                this.lineCard[i].cards = cards.slice(i * MAX_CNT, (i + 1) * MAX_CNT);
            }
        }
    }

    get cards(): number[] {
        return this._cards;
    }

    get pokers(): PokerCard[] {
        let arr = [];
        this.lineCard.forEach(js => {
            arr = arr.concat(js.pokers);
        });
        return arr;
    }
}
