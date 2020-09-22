import PokerCard from "./PokerCard";
import CardCtrl from "./CardCtrl";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TouchPoker extends cc.Component {

    onLoad() {
        this.registerEvent();
    }

    get cards(): PokerCard[] {
        return this.getComponent(CardCtrl).pokers;
    }

    public get shootCards(): number[] {
        let arr: number[] = [];
        this.cards.forEach(js => {
            if (js.shoot) {
                arr.push(js.card);
            }
        });
        return arr;
    }
    public set shootCards(cards: number[]) {
        this.cards.forEach(js => js.shoot = false);
        let isFind = false;
        cards.forEach((card)=> {
            isFind = false;
            for (let js of this.cards) {
                if (js.card === card) {
                    isFind = true;
                    js.shoot = true;
                    break;
                }
            }
            if (!isFind)
                console.log('当前手牌中无' + card);
        });
    }

    private _startIdx: number = -1;

    private _endIdx: number = -1;

    private _interval: number = 0;

    registerEvent() {
        if (!this.node.getComponent(cc.Layout)) return;
        // 每张牌可见的长度
        this._interval = this.node.children[0].width + this.node.getComponent(cc.Layout).spacingX;
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchBegin, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnded, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
    }

    private onTouchBegin(event: cc.Event.EventTouch) {
        let posX = this.node.convertToNodeSpaceAR(event.touch.getLocation()).x;
        this._startIdx = this._getTouchIdx(posX);
        this.cards[this._startIdx].isGray = !this.cards[this._startIdx].isGray;
    }

    private onTouchMoved(event: cc.Event.EventTouch) {
        let posX = this.node.convertToNodeSpaceAR(event.touch.getLocation()).x;
        this._endIdx = this._getTouchIdx(posX);
        for (let i = 0; i < this.cards.length; i++) {
            if (this._endIdx > this._startIdx && i >= this._startIdx && i <= this._endIdx ||
                this._endIdx <= this._startIdx && i >= this._endIdx && i <= this._startIdx)
                this.cards[i].isGray = true;
            else
                this.cards[i].isGray = false;
        }
    }

    private onTouchEnded(event: cc.Event.EventTouch) {
        this.cards.forEach(js => {
            if (js.isGray) {
                js.isGray = false;
                js.shoot = !js.shoot;
            }
        })
    }

    private onTouchCancelled(event: cc.Event.EventTouch) {
        this.cards.forEach(js => {
            if (js.isGray) {
                js.isGray = false;
            }
        })
    }


    private _getTouchIdx(posX: number) {
        // 每张牌的锚点为(0.5, 0.5), 则起始位置
        let startX = this.cards[0].node.x - this.cards[0].node.width / 2;
        for (let i = 0; i < this.cards.length; i++) {
            if (posX < ((i + 1) * this._interval + startX)) {
                return i;
            }
        }
        return this.cards.length - 1;
    }
}
