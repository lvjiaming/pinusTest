import MJCard from "./MJCard";

const { ccclass, property } = cc._decorator;


const MAX_CARD = 11;

@ccclass
export default class DiscardCtrl extends cc.Component {

    @property(cc.Node)
    layout: cc.Node[] = [];

    @property
    isTurn: boolean = false;

    _cards: MJCard[] = []
    @property
    get cards() {
        if (this._cards.length == 0) {
            for (let i = 0; i < this.layout.length; i++) {
                for (let j = 0; j < this.layout[i].children.length; j++) {
                    let idx = this.isTurn ? this.layout[i].children.length - j - 1 : j;
                    let node = this.layout[i].children[idx];
                    this._cards.push(node.getComponent(MJCard));
                }
            }
        }
        return this._cards;
    }

    playerCnt: number = 0;
    nextWeaveCtrl: DiscardCtrl;

    onLoad() {
        this.cards.forEach(card => {
            card.node.active = false;
        });
    }

    public setCards(cardData: number[]): void {
        for (let i in this.cards) {
            if (!cardData[i]) continue;
            if (this.cards[i].node.parent == this.layout[2] && this.playerCnt == 2 && this.nextWeaveCtrl) {
                return this.nextWeaveCtrl.setCards(cardData.slice(parseInt(i)));
            }
            if (cardData[i]) {
                this.cards[i].card = cardData[i];
            }
            this.cards[i].node.active = !!cardData[i];
        }
    }

    public getNextCard() {
        for (let card of this.cards) {
            if (card.node.parent == this.layout[2] && this.playerCnt == 2) {
                return this.nextWeaveCtrl.getNextCard();
            }
            if (!card.node.active) return card;
        }
    }

    public resetView() {
        this.cards.forEach(card => {card.node.active = false})
    }

    
}
