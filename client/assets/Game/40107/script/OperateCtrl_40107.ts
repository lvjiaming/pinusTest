import BaseClass from "../../../Common/script/BaseClass";
import CardCtrl from "../../Poker/script/CardCtrl";
import TouchPoker from "../../Poker/script/TouchPoker";
import { IBankInfo } from "./GameClient_40107";
import GameLogic_40107, { TYPE } from "./GameLogic_40107";
import HandCard_40107 from "./HandCard_40107";

const {ccclass, property} = cc._decorator;

@ccclass
export default class OperateCtrl_40107 extends BaseClass {

    chair: number = -1;

    @property(HandCard_40107)
    handCtrl: HandCard_40107 = null;

    tipsCard: number[][] = [];

    tipIdx: number = 0;

    currentCard: number[] = [];

    onLoad() {
        this.on(['onOpCall', 'onOpKick', 'onOpShow', 'onOpOut', 'onCurrentUser']);
    }

    onOpCall(data: IBankInfo) {
        this.resetView();
        this.$('_btCall#0').active = true;
        this.$('_btCall#1').active = true;
        this.$('_btCall#2').active = true;
        this.$('_btCall#3').active = true;
        this.$('_btCall#0', cc.Button).interactable = !data.mustCall;
        this.$('_btCall#1', cc.Button).interactable = data.cellScore < 1 && !data.mustCall;
        this.$('_btCall#2', cc.Button).interactable = data.cellScore < 2 && !data.mustCall;
        this.$('_btCall#3', cc.Button).interactable = data.cellScore < 3;
    }

    onOpKick() {
        this.resetView();
        this.$('_btKick#0').active = true;
        this.$('_btKick#1').active = true;
    }

    onOpShow() {
        this.resetView();
        this.$('_btShow#0').active = true;
        this.$('_btShow#1').active = true;
    }

    onOpOut(current: number[]) {
        this.resetView();
        let cards = this.handCtrl.getComponent(CardCtrl).cards;
        this.tipIdx = 0;
        this.tipsCard = GameLogic_40107.instance.getBiggerCard(cards, current)
        if (this.tipsCard.length == 0) {
            this.$('_btOut').active = true;
        } else {
            this.$('_btOut#0').active = true;
            this.$('_btOut#1').active = true;
            this.$('_btTip').active = true;
            this.$('_btOut#0', cc.Button).interactable = current.length != 0;   
        }
        vv.gameClient.gameView.$('_tip').active = this.tipsCard.length == 0;
        this.currentCard = current;
    }

    onCurrentUser(data: { chair: number }) {
        if (this.chair != data.chair) this.resetView();
    }

    _onBtCall(event: cc.Component.EventHandler, data: string) {
        vv.gameClient.sendGame('onCallScore', parseInt(data));
    }

    _onBtKick(event: cc.Component.EventHandler, data: string) {
        vv.gameClient.sendGame('onKick', data == '1');
    }

    _onBtShow(event: cc.Component.EventHandler, data: string) {
        vv.gameClient.sendGame('onShowCard', data == '1');
    }

    _onBtTip() {
        if (this.tipsCard.length == 0) {
            this._onBtOut(null, '0');
            return;
        }
        this.handCtrl.getComponent(TouchPoker).shootCards = this.tipsCard[this.tipIdx++];
        if (this.tipIdx >= this.tipsCard.length) this.tipIdx = 0;
    }

    _onBtOut(event: cc.Component.EventHandler, data: string) {
        let cards = this.handCtrl.getComponent(TouchPoker).shootCards;
        if (data == '1') {
            let type = GameLogic_40107.instance.getCardType(cards);
            if (type == TYPE.ERROR) return;
            if (this.currentCard.length > 0 && !GameLogic_40107.instance.compareCard(cards, this.currentCard)) return;
        }
        vv.gameClient.sendGame('onOutCard', data == '1' ? cards : []);
        this.handCtrl.getComponent(TouchPoker).shootCards = [];
    }

    resetView() {
        vv.gameClient.gameView.$('_tip').active = false;
        this.node.children.forEach(child => child.active = false);
    }
}
