import BaseClass from "../../../Common/script/BaseClass";
import { IBaseCard } from "../../52200/script/GameClient_52200";
import { INVALID_CHAIR } from './../../Public/script/GameClient';
import AutoCtrl from "./AutoCtrl";
import DiscardCtrl from "./DiscardCtrl";
import MJCard, { TYPE } from "./MJCard";
import MJHandCard from "./MJHandCard";

const { ccclass, property, executeInEditMode } = cc._decorator;

export interface IHandCard {
    handCard: number[];
    currentCard: number;
    isAction?: boolean;
}


interface IUserOutCard {
    cardData: number;
}



@ccclass
export default class HandCtrl extends BaseClass {

    @property
    isTurn: boolean = false;
    @property(cc.Layout)
    layout: cc.Layout = null;
    _cards: MJCard[] = [];
    @property
    get cards(): MJCard[] {
        if (this._cards.length == 0) {
            for (let i in this.layout.node.children) {
                if (this.isTurn) {
                    this._cards[this.layout.node.children.length - parseInt(i) - 1] = this.layout.node.children[i].getComponent(MJCard);
                } else {
                    this._cards[i] = this.layout.node.children[i].getComponent(MJCard);
                }
            }
        }
        return this._cards;
    }
    @property(MJCard)
    curent: MJCard = null;

    _chair: number = INVALID_CHAIR;
    set chair(value: number) {
        if (this._chair == INVALID_CHAIR) {
            this._chair = value;
        }
    }

    get allCards(): MJCard[] {
        return this.cards.concat(this.curent)
    }

    discardCtrl: DiscardCtrl = null;
    get outCard(): MJCard {
        return this.node.getChildByName('outCard').getComponent(MJCard);
    }

    touchEnabled: boolean = false;

    _startPos: cc.Vec2;
    _startTouch: cc.Vec2;

    _outCardPos: cc.Vec2;

    hunCard: number = 0;

    private scale: number = 0;

    private listenTips = false;

    @property(AutoCtrl)
    autoCtrl: AutoCtrl = null;

    _stopAuto: boolean = false;
    set stopAuto(value: boolean) {
        this._stopAuto = value;
        if (!value && this.curent.node.active) {
            this.onAutoOut(this.curent.card);
        }
    }
    get stopAuto() {
        return this._stopAuto;
    }


    onLoad() {
        if (this.node.getChildByName('outCard'))
            this._outCardPos = this.outCard.node.getPosition();
        this.node.active = false;
        this.scale = this.curent.scale;
    }

    registEvent(isMe: boolean) {
        if (isMe) {
            this.on(['onHandCard', 'onUserCanOut']);
            this.registClick();
            this.node.zIndex = 100;
        } else {
            this.on(['onBaseCard'])
        }
        this.on(['onSendCard', 'onSendCardFall']);
    }

    registClick() {
        this.allCards.forEach(card => {
            card.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
                let node = event.target;
                this.layout.enabled = false;
                this._startPos = node.getPosition();
                this._startTouch = event.getLocation();
                if (this._startPos.y != 0) {
                    this._startTouch.y -= this._startPos.y;
                    this._startPos.y = 0;
                }
                // if (!node.getComponent(MJCard).shoot) {
                //     cards.forEach(card => {
                //         card.shoot = false;
                //     })
                // }
            }, this);
            card.node.on(cc.Node.EventType.TOUCH_MOVE, (event: cc.Event.EventTouch) => {
                if (!this.touchEnabled) return
                let move = event.getLocation();
                let offset = move.subtract(this._startTouch);
                let pos = this._startPos.add(offset);
                let mj = event.target.getComponent(MJCard);
                event.target.setPosition(pos);
                if (Math.abs(offset.x) > 100 || Math.abs(offset.y) > 100) {
                    mj._shoot = false;
                }
                this.autoCtrl.isAuto = false;
            }, this);
            card.node.on(cc.Node.EventType.TOUCH_CANCEL, (event: cc.Event.EventTouch) => {
                let node = event.target;
                node.setPosition(this._startPos);
            });
            card.node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
                let node = event.target;
                let offset = node.getPosition().subtract(this._startPos);
                let mj = node.getComponent(MJCard);
                if (!this.touchEnabled && mj.shoot) {
                    mj.shoot = false;
                    (<any>vv.gameClient.gameView).showCard(255);
                }
                else if (this.touchEnabled && offset.y > 0 && (Math.abs(offset.x) > 100 || Math.abs(offset.y) > 100 || mj.shoot)) {
                    node.active = false;
                    node.setPosition(this._startPos);
                    this.sendOutCard(mj.card);
                    this.autoCtrl.isAuto = false;
                    (<any>vv.gameClient.gameView).showCard(255);
                } else {
                    node.setPosition(this._startPos);
                    this.allCards.forEach(card => {
                        card.shoot = false;
                    });
                    mj.shoot = true;
                    (<any>vv.gameClient.gameView).showCard(mj.card);
                    if (this.listenTips) {
                        if ((<MJHandCard>mj).isTips) {
                            vv.gameClient.sendGame('onListenCard', {
                                cardData: mj.card
                            });
                        } else {
                            let node = vv.gameClient.gameView.m_loadPrefab['ListenTips'];
                            if (node && node.active) node.active = false;
                        }
                    }
                    vv.audio.playEffect('sort');
                }
                this.layout.enabled = true;
            }, this);
        })
    }

    sendOutCard(card: number) {
        this.touchEnabled = false;
        this.listenTips = false;
        this.stopAuto = false;
        let node = vv.gameClient.gameView.m_loadPrefab['ListenTips'];
        if (node && node.active) node.active = false;
        let cards = this.cards.concat(this.curent);
        for (let card of cards) {
            card.isGray = false;
            card.shoot = false;
            (<MJHandCard>card).isTips = false;
        }
        vv.gameClient.sendGame('onOutCard', {
            cardData: card
        } as IUserOutCard);
    }

    onSendCard(data: { cardData: number, chair: number }) {
        if (this._chair != data.chair) return;
        // 回放去除动画
        if (vv.replay != null) {
            this.outCard.node.setPosition(this._outCardPos);
            this.outCard.node.active = true;
            this.outCard.card = data.cardData;
        } else {
            this.outCard.node.setPosition(this.curent.node.getPosition());
            this.outCard.node.scale = this._chair == vv.gameClient.meChairID ? 1 : 0.5;
            this.outCard.card = data.cardData;
            this.outCard.node.active = true;
            let move = cc.moveTo(0.1, this._outCardPos);
            let scale = cc.scaleTo(0.1, 1);
            this.outCard.node.runAction(cc.spawn(move, scale));
        }
        vv.audio.playEffect(data.cardData + '');
    }

    onSendCardFall(data: { cardData: number, chair: number }) {
        if (this._chair != data.chair) return;
        // 回放去除动画
        if (vv.replay != null) {
            let tableCard = this.discardCtrl.getNextCard();
            this.outCard.node.active = false;
            tableCard.card = this.outCard.card;
            tableCard.node.active = true;
        }
        else {
            this.scheduleOnce(() => {
                let tableCard = this.discardCtrl.getNextCard();
                let node = tableCard.node;
                let world = node.parent.convertToWorldSpaceAR(node.getPosition());
                let nodepos = this.outCard.node.parent.convertToNodeSpaceAR(world);
                this.outCard.node.runAction(cc.sequence(cc.spawn(cc.moveTo(0.1, nodepos), cc.scaleTo(0.1, 0.5)), cc.callFunc(() => {
                    this.outCard.node.active = false;
                    tableCard.card = this.outCard.card;
                    tableCard.node.active = true;
                }, this)))
            }, 1)
        }
    }

    onUserCanOut({ currentUser }: { currentUser: number }) {
        this.touchEnabled = this._chair == currentUser
    }

    onHandCard(data: IHandCard) {
        this.node.active = true;
        this.layout.enabled = true;
        this.setCards(data.handCard, data.currentCard);
        this.onAutoOut(data.currentCard, data.isAction);
    }

    onAutoOut(currentCard: number, isAction?: boolean) {
        if (isAction) {
            this.stopAuto = true;
            return;
        }
        // 双重校验 自动出牌
        if (vv.gameClient.meChairID == this._chair && this.autoCtrl.isAuto && currentCard && !this.stopAuto && this.touchEnabled) {
            this.scheduleOnce(() => {
                if (this.autoCtrl.isAuto && currentCard && !this.stopAuto && this.touchEnabled) {
                    this.sendOutCard(currentCard);
                }
            }, 1)
        }
    }

    onBaseCard(data: IBaseCard) {
        if (data.cardCnt[this._chair]) {
            this.node.active = true;
            this.setOtherCard(data.cardCnt[this._chair]);
        }
    }

    public setCards(cardData: number[], current: number) {
        this.node.active = true;
        for (let i in this.cards) {
            if (cardData[i]) {
                this.cards[i].card = cardData[i];
                this.cards[i].node.active = true;
            } else {
                this.cards[i].node.active = false;
            }
        }
        if (current) {
            this.curent.card = current;
        }
        this.curent.node.active = !!current;
    }

    public setOtherCard(cardCnt: number) {
        let cur = (cardCnt - 2) % 3 == 0;
        if (cur) cardCnt--;
        for (let i in this.cards) {
            this.cards[i].node.active = parseInt(i) < cardCnt;
        }
        this.curent.node.active = cur;
    }

    public setListenCard(cardDatas: number[]) {
        if (this._chair != vv.gameClient.meChairID) return;
        let cards = this.allCards;
        for (let card of cards) {
            card.isGray = true;
        }
        for (let cardData of cardDatas) {
            for (let card of cards) {
                if (card.card == cardData) {
                    card.isGray = false;
                }
            }
        }
    }

    public setListenTips(cardDatas: number[]) {
        if (this._chair != vv.gameClient.meChairID) return;
        this.listenTips = true;
        let cards = this.allCards;
        for (let card of cards) {
            (<MJHandCard>card).isTips = false;
        }
        for (let cardData of cardDatas) {
            for (let card of cards) {
                if (card.card == cardData) {
                    (<MJHandCard>card).isTips = true;
                }
            }
        }
    }

    public resetView() {
        this.allCards.forEach(card => {
            card.node.active = false;
            card.type = TYPE.STAND;
            card.card = 0;
            if (this.scale != 0) {
                card.scale = this.scale;
            }
            if ((<MJHandCard>card).isTips != null) {
                (<MJHandCard>card).isTips = false;
            }
        });
        this.outCard.node.active = false;
    }
}
