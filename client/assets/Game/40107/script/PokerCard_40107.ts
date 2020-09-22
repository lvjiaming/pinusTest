import PokerCard from "../../Poker/script/PokerCard";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PokerCard_40107 extends PokerCard {


    @property
    set isBank (value: boolean) {
        this.node.getChildByName('bank').active = value;
    }
    get isBank (): boolean {
        return this.node.getChildByName('bank').active;
    }
}
