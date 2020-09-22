import ListenTips from "../../Mahjong/script/ListenTips";
import { IWeaveItem } from "../../Mahjong/script/WeaveItem";
import GameClient from "../../Public/script/GameClient";
import { TYPE } from './../../Mahjong/script/MJCard';
import GameEnd_52200 from "./GameEnd_52200";
import GameView_52200 from "./GameView_52200";

const { ccclass, property } = cc._decorator;

// CMD Server
interface IGameStart {
    playerStatus: boolean[];
    bankUser: number;
    lastCardCnt: number;
    hunCard: number;
}

export interface IBaseCard {
    cardCnt: number[];
    currentUser: number;
    weaveItem: IWeaveItem[][];
    currentCard: boolean;
}

interface IHandCard {
    handCard: number[];
    currentCard: number;
}

export interface IOperateNotify {
    actionMask: number;
    centerCard: number;
    cards: number[];
}

interface IUserCanOut {
    currentUser: number;
}

interface IGamePlay {
    playerStatus: boolean[];
    bankUser: number;
    currentUser: number;
    hunCard: number;
    discardCard: number[][];
    outCard: number
}
export interface IGameConclude {
    playerStatus: boolean[];
    handCard: number[][];
    weaveItem: IWeaveItem[][];
    chiHuRight: number[];
    provider: number;
    providCard: number;
    score: number[];
    hunCard: number;
    splitCard: number[];
    outHunCnt: number[];
    bankUser: number;
}

export interface IBigEnd {
    zimoCnt: number[],
    dianpaoCnt: number[],
    winCnt: number[],
    score: number[]
}


// CMD Client
interface IUserOperate {
    index: number;
}

interface IUserOutCard {
    cardData: number;
}

const RULE = {
    PLAYER_2: (1 << 0), //0 二人
    PLAYER_3: (1 << 1), //1 三人
    PLAYER_4: (1 << 2), //2 四人
    INNING_20: (1 << 3), //3 20局
    INNING_30: (1 << 4), //4 30局
    SCORE_100: (1 << 5), //5 100底分
    SCORE_200: (1 << 6), //6 200底分
    FIRE_PAY_3: (1 << 7), //7 点炮包三家
    FIRE_3_PAY: (1 << 8), //8 点炮三家付
    JIA_37: (1 << 9), //9 37夹
    TEAR: (1 << 10), //10 流泪
    SEA_MOON: (1 << 11), //11 海底捞月
};

@ccclass
export default class GameClient_52200 extends GameClient {


    // LIFE-CYCLE CALLBACKS:

    gameView: GameView_52200;

    lieScale: number[] = [1.35, 1.25, 0.56, 1.3];

    onLoad() {
        super.onLoad();
        this.on(['onGameStart', 'onScenceFree', 'onScencePlay',
            'onUserOperate', 'onGameConclude', 'onListenTips']);
        vv.pinus.once('onBigEnd', this.onBigEnd.bind(this), this);
    }

    onScenceFree() {

    }

    onScencePlay(data: IGamePlay) {
        this.gameView.setPlayerCnt(data.playerStatus);
        this.gameView.setDiscard(data.discardCard);
        this.gameView.setBank(data.bankUser);
        this.gameView.dirCtrl.setCurrent(data.currentUser);
        if (data.outCard) {
            let outCard = this.gameView.handCtrl[this.chair2View(data.currentUser)].outCard;
            outCard.card = data.outCard;
            outCard.node.active = true;
        }
        this.gameView.setHunCard(data.hunCard);
    }


    onGameStart(data: IGameStart) {
        this.gameView.resetView();
        this.gameView.setBank(data.bankUser);
        this.gameView.dirCtrl.setLeftCard(data.lastCardCnt);
        this.gameView.setHunCard(data.hunCard);
        this.gameView.setPlayerCnt(data.playerStatus);
    }

    onUserOperate(data: IOperateNotify[]) {
        this.gameView.handCtrl.forEach(js => {
            js.outCard.node.active = false;
        });
        this.gameView.playAction(data);
    }

    // onUserListen({ chair, state, show }: { chair: number, state: boolean, show?: boolean }) {
    //     if (!state) return;
    //     if (show == false) return;
    //     let data: IOperateNotify[] = [];
    //     data[chair] = {
    //         actionMask: WIK.LISTEN,
    //         centerCard: 0,
    //         cards: [],
    //     };
    //     this.gameView.playAction(data);
    // }

    async onListenTips(data: any) {
        let js = await this.gameView.showPrefab<ListenTips>('ListenTips');
        js.setView(data);
    }

    async onGameConclude(data: IGameConclude) {
        this.gameView.$('_btReady').parent.x = -1280;
        if (vv.replay) {
            let gameEnd = await this.gameView.showPrefab<GameEnd_52200>('GameEnd_52200');
            gameEnd.onGameConclude(data);
        } else {
            this.scheduleOnce(async () => {
                let gameEnd = await this.gameView.showPrefab<GameEnd_52200>('GameEnd_52200');
                gameEnd.onGameConclude(data);
                this.gameView.$('_btReady').parent.x = 0;
            }, 2);
        }
        for (let i = 0; i < data.playerStatus.length; i++) {
            if (!data.playerStatus[i]) continue;
            let view = this.chair2View(i);
            let js = this.gameView.handCtrl[view];
            js.setCards(data.handCard[i], data.chiHuRight[i] ? data.providCard : data.splitCard[i]);
            let scale = this.lieScale[view];
            js.allCards.forEach((card) => {
                card.type = TYPE.LIE;
                card.scale = scale
            });
        }
    }

    async onBigEnd(data: IBigEnd) {
        this.bigEndData = data;
    }

    public static getRuleStr(gameRules: number[], serverRules: number) {
        let str = '';
        if (RULE.PLAYER_2 & gameRules[0]) str += '2人 ';
        else if (RULE.PLAYER_3 & gameRules[0]) str += '3人 ';
        else str += '4人 ';

        if (RULE.INNING_20 & gameRules[0]) str += '20局 ';
        else str += '30局 ';

        if (RULE.SCORE_100 & gameRules[0]) str += '100分 ';
        else str += '200分 ';

        if (RULE.FIRE_PAY_3 & gameRules[0]) str += '点炮包三家 ';
        else str += '血战 ';

        if (RULE.JIA_37 & gameRules[0]) str += '37夹 ';
        if (RULE.TEAR & gameRules[0]) str += '杠后流泪 ';
        if (RULE.SEA_MOON & gameRules[0]) str += '海底捞月 ';

        return str;
    }

    public static getPlayerCnt(gameRules: number[]) {
        if (RULE.PLAYER_2 & gameRules[0]) return 2;
        else if (RULE.PLAYER_3 & gameRules[0]) return 3;
        else return 4;
    }

    getMaxPlayer() {
        return 4;
    }

    getTotalInning() {
        if (this.roomInfo.GameRules[0] & RULE.INNING_20) {
            return 20;
        } else {
            return 30;
        }
    }


    // update (dt) {}
}
