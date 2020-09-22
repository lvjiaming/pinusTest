import HandCard_40107 from "../../40107/script/HandCard_40107";
import PokerCard from "../../Poker/script/PokerCard";

const { ccclass, property } = cc._decorator;

const INTERVAL = 0.1;
@ccclass
export default class SendCard_40107 extends cc.Component {

    @property(HandCard_40107)
    handCtrl: HandCard_40107 = null;

    @property(cc.Node)
    posNode: cc.Node[] = [];

    private child: cc.Node[][] = [];

    scale: number[] = [2, 0.5, 0.5];

    playSendCard(cnt: number, cards: number[]) {
        this.handCtrl.cardCtrl.cards = cards;
        this.handCtrl.node.active = true;
        this.handCtrl.cardCtrl.getComponent(cc.Layout).updateLayout();
        this.handCtrl.node.active = false;
        let pos1 = this.node.children[0].getPosition();
        this.node.children.forEach(node => {
            node.setPosition(pos1);
            node.setScale(1);
            node.getComponent(PokerCard).card = 0;
            node.active = true;
        });
        this.node.active = true;
        for (let j = 0; j < 3; j++) {
            if (!this.child[j]) this.child[j] = [];
            for (let i = 0; i < cnt; i++) {
                let pos = this._convertPos(j == 0 ? this.handCtrl.node.children[i] : this.posNode[j - 1]);
                let node = this.child[j][i] || cc.instantiate(this.node.children[0]);
                node.parent = this.node;
                this.child[j][i] = node;
                node.runAction(cc.sequence(cc.delayTime(INTERVAL * i),
                    cc.spawn(cc.scaleTo(0.2, this.scale[j]), cc.moveTo(0.2, pos)),
                    cc.callFunc((event, data) => {
                        if (data[1] == 0) {
                            this.child[data[1]][data[0]].getComponent(PokerCard).card = cards[data[0]];
                            vv.audio.playEffect('card_fapai');
                        } else {
                            this.posNode[data[1] - 1].children[0].getComponent(cc.Label).string = (data[0] + 1) + '';
                            this.child[data[1]][data[0]].active = false;
                        }
                    }, this, [i, j])));
            }
        }
        return INTERVAL * cnt + 0.2;
    }

    _convertPos(node: cc.Node) {
        let pos = node.getPosition();
        let world = node.parent.convertToWorldSpaceAR(pos);
        let nodePos = this.node.convertToNodeSpaceAR(world);
        return nodePos;
    }

}
