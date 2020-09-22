import PokerCard from "./PokerCard";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CardCtrl extends cc.Component {

    _cards: number[] = [];
    set cards(cards: number[]) {
        this._cards = cards;
        for (let i = 0; i < cards.length; i++) {
            let node = this.node.children[i] || cc.instantiate(this.node.children[0]);
            node.parent = this.node;
            node.getComponent(PokerCard).card = cards[i];
            node.active = true;
        }
        if (cards.length < this.node.children.length) {
            for (let i = cards.length; i < this.node.children.length; i++) {
                this.node.children[i].active = false;
            }
        }
    }
    get cards(): number[] {
        return this._cards;
    }

    get pokers(): PokerCard[] {
        let arr = [];
        this.node.children.forEach(node => {
            if (node.active) arr.push(node.getComponent(PokerCard));
        });
        return arr;
    }
}
