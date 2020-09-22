import GameClient, { INVALID_CHAIR, MYSELF_VIEW_ID } from "../../Public/script/GameClient";
import GameEnd_40107 from "./GameEnd_40107";
import GameView_40107 from "./GameView_40107";

const { ccclass, property } = cc._decorator;


export interface IBankInfo {
    mustCall: boolean;
    cellScore: number;
}

enum OPSTATE {
    NO_CALL = 0,
    CALL_1,
    CALL_2,
    CALL_3,
    NO_DOUBLE,
    DOUBLE,
    NO_OUT
}

export const RULE = {
    INNING_10: 1 << 0, // 10局
    INNING_20: 1 << 1, // 20局
    GOOD_CALL: 1 << 2, // 四个二两王必叫
    NO_KICK: 1 << 3, // 不带踢
    FARMER_KICK: 1 << 4, // 农民踢
    ALL_KICK: 1 << 5, // 全踢
    SHOW_CARD: 1 << 6, // 明牌
    NO_345: 1 << 7, // 不带345
    MAX_48: 1 << 8, // 封顶48
    MAX_96: 1 << 9, // 封顶96
    MAX_192: 1 << 10, // 封顶192
    SCORE_100: 1 << 11,
    SCORE_200: 1 << 12
};

@ccclass
export default class GameClient_40107 extends GameClient {

    gameView: GameView_40107;

    bankUser: number = INVALID_CHAIR;

    onLoad() {
        super.onLoad();
        this.on(['onGameStart', 'onSceneFree', 'onBankScore', 'onSureBank', 'onUpdateTimes',
            'onGameConclude', 'onBigEnd']);
    }

    onSceneFree() {
    }

    onGameStart(data: { handCard: number[], currentUser: number, bankInfo: IBankInfo }) {
        this.gameView.resetView();
        vv.audio.playEffect('start');
        let delay = this.gameView.sendCtrl.playSendCard(data.handCard.length, data.handCard);
        this.scheduleOnce(() => {
            this.gameView.handCtrl[MYSELF_VIEW_ID].cardCtrl.cards = data.handCard;
            this.gameView.handCtrl[MYSELF_VIEW_ID].node.active = true;
            this.gameView.sendCtrl.node.active = false;
            if (data.currentUser == this.meChairID) {
                this.gameView.operateCtrl.onOpCall(data.bankInfo);
            }
            this.gameView.gameHead.forEach(js => js.onCurrentUser({ chair: data.currentUser }));
        }, delay);
    }

    onSureBank(data: { bankUser: number }) {
        this.bankUser = data.bankUser;
    }

    onBankScore({ score }: { score: number }) {
        this.gameView.$('_labScore', cc.Label).string = score + '';
    }

    onUpdateTimes({ times }: { times: number }) {
        this.gameView.$('_labTimes', cc.Label).string = times + '';
    }

    async onGameConclude(data: { score: number[], cards: number[][], spring: number, bankUser: number }) {
        this.gameView.$('_btReady').parent.x = -1280;
        if (data.spring) {
            let name = data.spring == 2 ? 'chuntian' : 'fanchuntian';
            this.gameView.$('_spring').active = true;
            this.gameView.$('_spring', dragonBones.ArmatureDisplay).armatureName = name;
            this.gameView.$('_spring', dragonBones.ArmatureDisplay).playAnimation(name, 1);
            this.scheduleOnce(async () => {
                this.gameView.$('_spring').active = false;
                let gameEnd = await this.gameView.showPrefab<GameEnd_40107>('GameEnd_40107');
                gameEnd.onGameConclude(data);
                this.gameView.$('_btReady').parent.x = 0;
            }, 2);
        } else {
            let gameEnd = await this.gameView.showPrefab<GameEnd_40107>('GameEnd_40107');
            gameEnd.onGameConclude(data);
            this.gameView.$('_btReady').parent.x = 0;
        }
    }

    async onBigEnd(data: any) {
        this.bigEndData = data;
    }

    getMaxPlayer() {
        return 3;
    }

    getTotalInning() {
        if (this.roomInfo.GameRules[0] & RULE.INNING_10) {
            return 10;
        } else {
            return 20;
        }
    }

    public static getRuleStr(gameRules: number[], serverRules: number) {
        let str = '';

        if (RULE.INNING_20 & gameRules[0]) str += '20局 ';
        else str += '10局 ';

        if (RULE.SCORE_100 & gameRules[0]) str += '100分 ';
        else if (RULE.SCORE_200 & gameRules[0]) str += '200分 ';

        if (RULE.GOOD_CALL & gameRules[0]) str += '双王、四个二必叫三分 ';

        if (RULE.NO_KICK & gameRules[0]) str += '不带踢 ';
        else if (RULE.FARMER_KICK & gameRules[0]) str += '农民踢 ';
        else str += '全踢 ';

        if (RULE.SHOW_CARD & gameRules[0]) str += '明牌 ';
        if (RULE.NO_345 & gameRules[0]) str += '不带345 ';

        str += '封顶:'
        if (RULE.MAX_48 & gameRules[0]) str += '48 ';
        else if (RULE.MAX_96 & gameRules[0]) str += '96 ';
        else str += '192 ';

        return str;
    }

    public static getPlayerCnt(gameRules: number[]) {
        return 3;
    }
}
