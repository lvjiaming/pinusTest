import AutoCtrl from "../../Mahjong/script/AutoCtrl";
import DirectionCtrl from "../../Mahjong/script/DirectionCtrl";
import DiscardCtrl from "../../Mahjong/script/DiscardCtrl";
import HandCtrl from "../../Mahjong/script/HandCtrl";
import MJCard from "../../Mahjong/script/MJCard";
import OperateCtrl from "../../Mahjong/script/OperateCtrl";
import WeaveCtrl from "../../Mahjong/script/WeaveCtrl";
import { WIK } from "../../Mahjong/script/WeaveItem";
import GameView from "../../Public/script/GameView";
import GpsCtrl from "../../Public/script/GpsCtrl";
import { MYSELF_VIEW_ID } from './../../Public/script/GameClient';
import { IOperateNotify } from "./GameClient_52200";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameView_52200 extends GameView {

    get dirCtrl(): DirectionCtrl {
        return this.$('_Direction', DirectionCtrl);
    }

    get hunCard(): MJCard {
        return this.$('_hunCard', MJCard);
    }

    _handCtrl: HandCtrl[] = []
    get handCtrl(): HandCtrl[] {
        if (this._handCtrl.length == 0) {
            for (let i in this.$('_Hand').children) {
                this._handCtrl[i] = this.$('_Hand').children[i].getComponent(HandCtrl);
            }
        }
        return this._handCtrl;
    }

    _discardCtrl: DiscardCtrl[] = []
    get discardCtrl(): DiscardCtrl[] {
        if (this._discardCtrl.length == 0) {
            for (let i in this.$('_Hand').children) {
                this._discardCtrl[i] = this.$('_Discard').children[i].getComponent(DiscardCtrl);
                this._discardCtrl[i].node.active = true;
            }
        }
        return this._discardCtrl;
    }

    _weaveCtrl: WeaveCtrl[] = [];
    get weaveCtrl(): WeaveCtrl[] {
        if (this._weaveCtrl.length == 0) {
            for (let i in this.$('_Hand').children) {
                this._weaveCtrl[i] = this.$('_Weave').children[i].getComponent(WeaveCtrl);
                this._weaveCtrl[i].node.active = true;
            }
        }
        return this._weaveCtrl;
    }

    _allCards: MJCard[] = [];
    get allCards(): MJCard[] {
        if (this._allCards.length == 0) {
            this._allCards = this.node.getComponentsInChildren(MJCard);
        }
        return this._allCards;
    }

    _actionAni: dragonBones.ArmatureDisplay[] = [];
    get actionAni(): dragonBones.ArmatureDisplay[] {
        if (this._actionAni.length === 0) {
            for (let i in this.$('_ani').children) {
                this._actionAni[i] = this.$('_ani').children[i].getComponent(dragonBones.ArmatureDisplay);
                this._actionAni[i].addEventListener(dragonBones.EventObject.COMPLETE, function (i) {
                    this._actionAni[i].node.active = false;
                }.bind(this, i));
            }
        }
        return this._actionAni;
    }

    onLoad() {
        super.onLoad();
        this.setHunCard(0);
        this.$('_OperateCtrl', OperateCtrl).handCtrl = this.handCtrl[MYSELF_VIEW_ID];
        this.discardCtrl[0].nextWeaveCtrl = this.discardCtrl[1];
        this.discardCtrl[2].nextWeaveCtrl = this.discardCtrl[3];
        for (let i = 0; i < this.handCtrl.length; i++) {
            this.handCtrl[i].registEvent(i == MYSELF_VIEW_ID);
        }
    }

    enterView(chairID, viewID): void {
        this.dirCtrl.setChair(this.gameClient.meChairID);
        this.handCtrl[viewID].chair = chairID;
        this.handCtrl[viewID].discardCtrl = this.discardCtrl[viewID];
        this.weaveCtrl[viewID].chair = chairID;
        this.$('_warn', cc.Toggle).isChecked = GpsCtrl.isWarn(vv.gameClient.sitUser);
    }

    public setBank(banker: number) {
        for (let i = 0; i < this.gameHead.length; i++) {
            if (this.gameHead[i].node.active) {
                this.gameHead[i].isBanker = i == this.gameClient.chair2View(banker);
            }
        }
    }

    public setHunCard(cardData: number) {
        this.allCards.forEach(card => card.hunCard = cardData);
        this.hunCard.card = cardData;
        this.hunCard.node.parent.active = !!cardData;
        this.hunCard.isMagic = false;
    }

    public setDiscard(cards: number[][]) {
        console.log('setDiscard' + vv.userInfo.UserID);
        for (let i = 0; i < cards.length; i++) {
            if (!cards[i]) continue;
            this.discardCtrl[i].setCards(cards[this.gameClient.chair2View(i)]);
        }
    }

    public setPlayerCnt(playerStatus: boolean[]) {
        let cnt = 0
        playerStatus.forEach(status => {
            if (status) cnt++
        });
        this.discardCtrl.forEach(js => js.playerCnt = cnt);
    }

    public playAction(data: IOperateNotify[]) {
        // 回放回退不播动画
        if (vv.replay && vv.replay.isReturn) return;
        let delay = 0;
        for (let i = 0; i < data.length; i++) {
            if (!data[i]) continue;
            let name = this._getActionName(data[i].actionMask);
            if (name == '') continue;
            this.scheduleOnce(function (i, name) {
                let ani = this.actionAni[this.gameClient.chair2View(i)];
                ani.node.active = true;
                ani.armatureName = name;
                ani.playAnimation('newAnimation', 1);
                vv.audio.playEffect(name);
            }.bind(this, i, name), delay);
            delay += 0.5;
        }
    }

    private _getActionName(actionMask: number) {
        switch (actionMask) {
            case WIK.CENTER:
            case WIK.RIGHT:
            case WIK.LEFT: {
                return 'chi';
            }
            case WIK.PENG: {
                return 'peng';
            }
            case WIK.GANG: {
                return 'gang';
            }
            case WIK.CHI_HU: {
                return 'hu';
            }
            case WIK.LISTEN: {
                return 'ting'
            }
            default: {
                return '';
            }
        }
    }

    public showCard(card: number) {
        let cards: MJCard[] = [];
        this.discardCtrl.forEach(js => {
            cards = cards.concat(js.cards);
        });
        this.weaveCtrl.forEach(js => {
            js.weaveItems.forEach(item => {
                cards = cards.concat(item.cards);
            });
        });
        cards = cards.concat(this.handCtrl[MYSELF_VIEW_ID].allCards);
        cards.forEach(js => {
            js.isSelect = (js.card == card && js.node.active && js.node.parent.active);
        });
    }
    
    public resetView() {
        this.dirCtrl.resetView();
        this.setHunCard(0);
        this.discardCtrl.forEach(js => js.resetView());
        this.weaveCtrl.forEach(js => js.resetView());
        this.handCtrl.forEach(js => {
            js.resetView();
        });
        this.gameHead.forEach(js => js.resetView());
        let end = this.m_loadPrefab['GameEnd_52200'];
        if (end && end.active) {
            end.active = false;
        }
        let auto = this.$('_AutoCtrl', AutoCtrl);
        auto.$('_btAuto',cc.Toggle).isChecked = false;
        auto.node.active = false;
    }
}
