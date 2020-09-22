import { GameState, INVALID_CHAIR } from "../table";
import { DBManager } from './../../repositories/dbManager';
import { Response } from './../../util/response';
import { RULE, TYPE } from './define';
import { GameLogic } from "./gameLogic";


// CMD Server
interface IBankInfo {
    mustCall: boolean;
    cellScore: number;
}


// CMD Client

// 常量
const GAME_PLAYER = 3;

enum STATE {
    CALL = 0,   // 叫分
    DOUBLE,     // 加倍
    SHOW,       // 明牌
    OUT         // 出牌
}

enum OPSTATE {
    NO_CALL = 0,
    CALL_1,
    CALL_2,
    CALL_3,
    NO_DOUBLE,
    DOUBLE,
    NO_OUT,
    SHOW
}


export class CTableSink implements ITableSink {

    private gameLogic: GameLogic;

    private gameRules: number[] = [];

    private playerStatus: boolean[] = [];

    private state: STATE = STATE.CALL;

    private firstUser: number = INVALID_CHAIR;

    private currentUser: number = INVALID_CHAIR;

    private bankUser: number = INVALID_CHAIR;
    // 当前牌库
    private repertoryCard: number[] = [];
    // 三张暗牌
    private backCard: number[] = [];
    // 手牌
    private handCard: number[][] = [];
    // 当轮牌
    private currentCard: number[][] = [];
    // 当轮最大玩家
    private maxUser: number = INVALID_CHAIR;
    // 加倍 -1 未操作 0 不加倍 1加倍
    private isDouble: number[] = [];
    // 叫分 -1 未操作 0 不叫 1 一分 2 两分 3 三分
    private callScore: number[] = [];
    // 是否明牌
    private isShowCard: boolean[] = [];
    // 低分
    private cellScore: number = 0;
    // 出牌数量
    private outCardTimes: number[] = [];
    // 翻倍
    private times: number = 0;

    private maxScore: number = 0;

    private isEnd: boolean = false;
    // 大结算数据
    private winCnt: number[] = [];

    private bombCnt: number[] = [];

    private bankCnt: number[] = [];

    private totalScore: number[] = []

    constructor(private m_pTable: ITable) {
        this.gameLogic = new GameLogic();
    }

    private _initRoom() {
        this.playerStatus = [];
        for (let i = 0; i < GAME_PLAYER; i++) {
            if (!!this.m_pTable.sitUser[i]) {
                this.playerStatus[i] = true;
            }
        }
        this.backCard = [];
        this.repertoryCard = [];
        this.forUser((i) => {
            this.handCard[i] = [];
            this.isDouble[i] = -1;
            this.callScore[i] = -1;
            this.isShowCard[i] = false;
            this.currentCard[i] = [];
            this.outCardTimes[i] = 0;
        });
        this.state = STATE.CALL;
        this.cellScore = 0;
        this.bankUser = INVALID_CHAIR;
        this.maxUser = INVALID_CHAIR;
        this.times = 0;
        this.m_pTable.clearTimer('autoStart');
    }

    public setRules(gameRules: number[], serverRules: number): void {
        this.gameRules = gameRules;
        this.gameLogic.setRules(gameRules);
        if (this._hasRule(RULE.MAX_48)) {
            this.maxScore = 48;
        } else if (this._hasRule(RULE.MAX_96)) {
            this.maxScore = 96;
        } else {
            this.maxScore = 192;
        }
        for (let i = 0; i < GAME_PLAYER; i++) {
            this.winCnt[i] = 0;
            this.bombCnt[i] = 0;
            this.bankCnt[i] = 0;
            this.totalScore[i] = 0;
        }
    }

    public getMaxChair() {
        return GAME_PLAYER;
    }

    public getUserCnt(): number {
        return GAME_PLAYER;
    }

    public getMaxInning(): number {
        if (this._hasRule(RULE.INNING_20)) return 20;
        else return 10;
    }


    public onEnterUser(chair: number, user: ITableUser): void {
        if (this.firstUser == INVALID_CHAIR) {
            this.firstUser = chair;
        }
        if (this._hasRule(RULE.SCORE_100)) {
            user.Score = 100;
        } else if (this._hasRule(RULE.SCORE_200)) {
            user.Score = 200;
        }
    }

    public async onCheckEnter(userID: number): Promise<boolean> {
        if (!this.m_pTable.roomInfo.ClubKey) return true;
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(this.m_pTable.roomInfo.ClubKey, userID);
        let score = this._hasRule(RULE.SCORE_100) ? 100 : 200;
        // score += this.gameRules[1];
        if (userInfo.Score < score) {
            this.m_pTable.sendMsgByUserID(userID, 'onErrMsg', Response.ERROR('您的积分不足无法进入房间'));
            return false;
        }
        return true;
    }

    public onLeaveUser(chair: number): void {
        if (this.firstUser == chair) {
            this.firstUser = this.findNext(chair);
        }
    }

    public onScene(chairID: number): boolean {
        let state: GameState = this.m_pTable.gameState;
        switch (state) {
            case GameState.SCENE_FREE: {
                let obj = {};
                return this.m_pTable.sendMsgByChair(chairID, 'onSceneFree', obj);
            }
            case GameState.SCENE_PLAYING: {
                let obj = {};
                this.updateHandCard(chairID);
                if (chairID == this.currentUser) {
                    this._operateNotify(chairID);
                } else {
                    this.m_pTable.sendMsgByChair(chairID, 'onCurrentUser', {
                        chair: this.currentUser
                    });
                }
                if (this.bankUser != INVALID_CHAIR) {
                    this.m_pTable.sendMsgByChair(chairID, 'onSureBank', {
                        backCard: this.backCard,
                        bankUser: this.bankUser,
                        first: false
                    });
                }
                this.forUser(i => {
                    if (this.currentCard[i].length > 0) {
                        this.m_pTable.sendMsgByChair(chairID, 'onOutCard', { chair: i, cards: this.currentCard[i], first: false });
                    }
                });
                this._notifyTimes();
                this.m_pTable.sendMsgToAll('onBankScore', { score: this.cellScore });
                this.m_pTable.sendMsgByChair(chairID, 'onScenePlay', obj);
            }
            default: {
                console.log('onScene state:' + state);
            }
        }
        return true;
    }

    public onFrameStart(): boolean {
        // 初始化游戏数据
        this._initRoom();
        this.m_pTable.gameState = GameState.SCENE_PLAYING;

        if (this.firstUser == INVALID_CHAIR) {
            this.firstUser = this.findNext(this.gameLogic.getRandomValue(GAME_PLAYER));
        }
        // 洗牌
        this.repertoryCard = this.gameLogic.shuffle();
        let handCnt = this.repertoryCard.slice(0, -3).length / GAME_PLAYER;
        this.forUser((i) => {
            this.handCard[i] = this.repertoryCard.slice(i * handCnt, (i + 1) * handCnt);
            // this.handCard[i] = [0x02, 0x12, 0x22, 
            //     0x01, 0x21, 0x11, 
            //     0x0C, 0x1C, 0x2C, 
            //     0x0B, 0x1B, 0x2B, 
            //     0x0D, 0x1D, 0x2D, 0x28, 0x29
            // ]
        });
        this.backCard = this.repertoryCard.slice(-3);
        this.currentUser = this.firstUser;
        let obj: IBankInfo = {
            mustCall: this.gameLogic.checkGoodCard(this.handCard[this.currentUser]),
            cellScore: this.cellScore
        };
        this.handCard.forEach(card => this.gameLogic.sortCard(card));
        this.forUser(i => {
            this.m_pTable.sendMsgByChair(i, 'onGameStart', {
                handCard: this.handCard[i],
                currentUser: this.currentUser,
                bankInfo: obj
            });
        });
        this._notifyTimes();
        this.m_pTable.sendMsgToAll('onBankScore', { score: this.cellScore });
        return true;
    }

    // 牌处理
    private _updateHandCnt() {
        let cnt: number[] = [];
        this.forUser(i => {
            cnt[i] = this.handCard[i].length
        });
        this.m_pTable.sendMsgToAll('onUpdateHandCnt', cnt);
    }

    private _updateUserCard(chair: number) {
        if (this.isShowCard[chair]) {
            this.m_pTable.sendMsgToAll('onUpdateCard', { chair: chair, cards: this.handCard[chair] });
        } else {
            this.m_pTable.sendMsgByChair(chair, 'onUpdateCard', { chair: chair, cards: this.handCard[chair] });
        }
    }

    private updateHandCard(chair: number) {
        this._updateHandCnt();
        this._updateUserCard(chair);
    }

    private _operateNotify(chair: number) {
        this.currentUser = chair;
        switch (this.state) {
            case STATE.CALL: {
                let obj: IBankInfo = {
                    mustCall: this.gameLogic.checkGoodCard(this.handCard[chair]),
                    cellScore: this.cellScore
                };
                this.m_pTable.sendMsgByChair(chair, 'onOpCall', obj);
                break;
            }
            case STATE.DOUBLE: {
                this.m_pTable.sendMsgByChair(chair, 'onOpKick', {});
                break;
            }
            case STATE.SHOW: {
                this.m_pTable.sendMsgByChair(chair, 'onOpShow', {});
                break;
            }
            case STATE.OUT: {
                this.m_pTable.sendMsgToAll('onOutCard', { chair: chair, cards: [], first: false });
                this.currentCard[chair] = [];
                this.m_pTable.sendMsgByChair(chair, 'onOpOut',
                    this.maxUser == INVALID_CHAIR ? [] : this.currentCard[this.maxUser]);
                break;
            }
            default: {
                break;
            }
        }
        this.m_pTable.sendMsgToAll('onCurrentUser', {
            chair: chair
        });
    }

    public onEventTimer(key: string, param: any): boolean {
        if (key == 'autoStart') {
            this.m_pTable.startGame();
        }
        return true;
    }

    public sendBigEnd() {
        this.m_pTable.sendMsgToAll('onBigEnd', {
            score: this.totalScore,
            winCnt: this.winCnt,
            bombCnt: this.bombCnt,
            bankCnt: this.bankCnt
        });
    }

    public concludeGame(chair: number, isDiss?: boolean) {
        let next = this.findNext(this.bankUser);
        let spring = chair == this.bankUser && this.outCardTimes[next] == 0 && this.outCardTimes[this.findNext(next)] == 0;
        let anSpring = chair != this.bankUser && this.outCardTimes[this.bankUser] == 1;
        let score = this.calScore(chair, spring || anSpring);
        let revenue: number[] = [];

        // this.forUser(user => {
        //     if (this.m_pTable.roomInfo.ClubKey) {
        //         revenue[user] = (this.m_pTable.roomInfo.Process == 1 && !isDiss) ? this.gameRules[1] : 0;
        //     }
        // });
        let springIdx = 0;
        if (spring) {
            springIdx = 2;
        } else if (anSpring) {
            springIdx = 1;
        } else {
            springIdx = 0;
        }
        this.m_pTable.sendMsgToAll('onGameConclude', {
            score: score,
            cards: this.handCard,
            spring: isDiss ? 0 : springIdx,
            bankUser: this.bankUser
        });
        if (this.m_pTable.roomInfo.ClubKey &&this.m_pTable.roomInfo.Process == 1 && !isDiss) {
            this.forUser(i=> {
                score[i] -= this.gameRules[1];
            })
        }
        this.m_pTable.writeScore(score, null);
        this.m_pTable.concludeGame(this.isEnd || isDiss);
        if (!this.isEnd && !isDiss) {
            this.m_pTable.setTimer('autoStart', 12000);
        }
        return true;
    }

    private calScore(chair: number, spring: boolean) {
        let userScore: number[] = [];
        if (chair == INVALID_CHAIR) {
            this.forUser(i => {
                userScore[i] = 0;
            });
            return userScore;
        }
        let baseScore = chair == this.bankUser ? -this.cellScore : this.cellScore;
        // 春天翻倍
        baseScore *= spring ? 2 : 1;
        baseScore *= Math.pow(2, this.times);
        this.forUser(i => {
            if (i == this.bankUser) return;
            let score = baseScore;
            // 自己加倍x2
            score *= this.isDouble[i] == 1 ? 2 : 1;
            // 庄家加倍自己加倍x2
            score *= (this.isDouble[this.bankUser] == 1 && this.isDouble[i] == 1) ? 2 : 1;
            if (Math.abs(score) > this.maxScore) score = chair == this.bankUser ? -this.maxScore : this.maxScore;
            if (userScore[i] == null) userScore[i] = 0;
            if (userScore[this.bankUser] == null) userScore[this.bankUser] = 0;
            userScore[i] += score;
            userScore[this.bankUser] -= score;
        });
        if (this.m_pTable.roomInfo.ClubKey) {
            // 庄家输了钱不够
            if (userScore[this.bankUser] < 0 &&
                this.bankUser != chair &&
                this.m_pTable.sitUser[this.bankUser].Score < -userScore[this.bankUser]) {
                let newScore: number[] = [], bankScore = this.m_pTable.sitUser[this.bankUser].Score;
                // 给房费预留出来
                if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1) {
                    bankScore -= this.gameRules[1]
                }
                this.forUser(i => {
                    if (i == this.bankUser) return;
                    newScore[i] = Math.floor(bankScore * userScore[i] / (-userScore[this.bankUser]));
                });
                newScore[this.bankUser] = -bankScore;
                userScore = newScore;
                this.isEnd = true;
                // 如果地主赢了
            } else if (this.bankUser == chair) {
                userScore[this.bankUser] = 0;
                this.forUser(i => {
                    if (i == this.bankUser) return;
                    let score = this.m_pTable.sitUser[i].Score;
                    // 给房费预留出来
                    if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1) {
                        score -= this.gameRules[1]
                    }
                    if (score < -userScore[i]) {
                        userScore[i] = -score;
                        this.isEnd = true;
                    }
                    userScore[this.bankUser] -= userScore[i];
                });
            }
        }
        for (let i in userScore) {
            if (userScore[i] > 0) this.winCnt[i]++;
            this.totalScore[i] += userScore[i];
        }
        return userScore;
    }

    private forUser(call: (chair: number) => void | boolean) {
        for (let i in this.playerStatus) {
            if (call(parseInt(i))) break;
        }
    }

    private findNext(chair: number) {
        for (let i = 0; i < GAME_PLAYER; i++) {
            let next = (chair + i + 1) % GAME_PLAYER;
            if (!!this.m_pTable.sitUser[next]) return next;
        }
        return INVALID_CHAIR;
    }

    private _hasRule(rule: number) {
        return (this.gameRules[0] & rule) > 0;
    }

    private _notifyTimes() {
        if (this.bankUser == INVALID_CHAIR) {
            this.m_pTable.sendMsgToAll('onUpdateTimes', { times: 1 });
        } else {
            let bankTimes = 0;
            this.forUser(i => {
                if (i == this.bankUser) return;
                let times = this.times + (this.isDouble[i] == 1 ? 1 : 0) +
                    (this.isShowCard[i] ? 1 : 0) +
                    (this.isDouble[this.bankUser] == 1 && this.isDouble[i] == 1 ? 1 : 0);
                times = Math.pow(2, times);
                this.m_pTable.sendMsgByChair(i, 'onUpdateTimes', { times: times });
                bankTimes += times;
            })
            this.m_pTable.sendMsgByChair(this.bankUser, 'onUpdateTimes', { times: bankTimes });
        }
    }


    // 客户端->服务端
    public onCallScore(chair: number, score: number): boolean {
        if (this.currentUser != chair) return false;

        if (score > this.cellScore) {
            this.cellScore = score;
            this.bankUser = chair;
            this.m_pTable.sendMsgToAll('onBankScore', { score: this.cellScore });
        }
        this.callScore[chair] = score;
        this.m_pTable.sendMsgToAll('onOpRes', {
            chair: chair,
            state: score
        });

        // 都不叫, 重新发牌
        if (this.findNext(chair) == this.firstUser && this.cellScore == 0) {
            this.firstUser = this.findNext(this.firstUser);
            this.m_pTable.sendMsgToAll('onCurrentUser', {
                chair: INVALID_CHAIR
            });
            this.onFrameStart();
            return true;
        }

        // 有人叫3分, 或者轮完一圈有人叫
        if (this.cellScore != 0 && this.bankUser != INVALID_CHAIR &&
            (this.findNext(chair) == this.firstUser || this.cellScore == 3)) {
            // 确定庄
            this.handCard[this.bankUser] = this.handCard[this.bankUser].concat(this.backCard);
            this.gameLogic.sortCard(this.handCard[this.bankUser]);
            this.updateHandCard(this.bankUser);
            this._notifyTimes();
            this.bankCnt[this.bankUser]++;
            this.m_pTable.sendMsgToAll('onSureBank', {
                backCard: this.backCard,
                bankUser: this.bankUser,
                first: true
            });
            if (this._hasRule(RULE.NO_KICK)) {
                this._showOrOut();
            } else {
                this.state = STATE.DOUBLE;
                this._operateNotify(this.findNext(this.bankUser));
            }
            return true;
        } else {
            this._operateNotify(this.findNext(chair));
            return true;
        }
    }

    private _showOrOut(): void {
        if (this._hasRule(RULE.SHOW_CARD)) {
            this.state = STATE.SHOW;
        } else {
            this.state = STATE.OUT;
        }
        this._operateNotify(this.bankUser);
    }

    private _isFarmerUnKick() {
        let isUnKick = true;
        this.forUser(i => {
            if (i == this.bankUser) return;
            if (this.isDouble[i]) isUnKick = false;
        });
        return isUnKick;
    }

    public onKick(chair: number, isKick: boolean): boolean {
        if (this.currentUser != chair) return true;
        this.isDouble[chair] = isKick ? 1 : 0;
        this.m_pTable.sendMsgToAll('onOpRes', {
            chair: chair,
            state: isKick ? OPSTATE.DOUBLE : OPSTATE.NO_DOUBLE
        });
        this._notifyTimes();
        if (chair == this.bankUser || (this.findNext(chair) == this.bankUser) &&
            (this._isFarmerUnKick() || this._hasRule(RULE.FARMER_KICK))) {
            if (this.isDouble[this.bankUser] == -1) this.isDouble[this.bankUser] = 0;
            this._showOrOut();
        } else {
            this._operateNotify(this.findNext(chair));
        }
        return true;
    }

    public onShowCard(chair: number, isShow: boolean): boolean {
        if (this.bankUser != chair) return true;
        if (this.currentUser != chair) return true;
        this.isShowCard[chair] = isShow;
        if (isShow) {
            this.times++;
            this._notifyTimes();
            this.updateHandCard(chair);
            this.m_pTable.sendMsgToAll('onOpRes', {
                chair: chair,
                state: OPSTATE.SHOW
            });
        }
        this.state = STATE.OUT;
        this._operateNotify(this.bankUser);
        return true
    }

    public onOutCard(chair: number, cards: number[]): boolean {
        if (this.currentUser != chair) return true;

        // 没有当轮最大玩家, 然后还不出
        if (cards.length == 0 && this.maxUser == INVALID_CHAIR) {
            console.log('onOutCard error no maxUser and cards.length = 0');
            return false;
        }

        // 校验出牌
        if (!this._checkOutCard(cards)) {
            console.log('onOutCard error', this.currentCard, cards);
            return false;
        }

        if (cards.length != 0) {
            this.outCardTimes[chair]++;
            let type = this.gameLogic.getCardType(cards);
            if (type == TYPE.MISSILE || type == TYPE.BOMB) {
                this.times++;
                this.bombCnt[chair]++;
            }
            this._notifyTimes();
            this.gameLogic.removeCards(this.handCard[chair], cards);
            this.updateHandCard(chair);
        } else {
            this.m_pTable.sendMsgToAll('onOpRes', {
                chair: chair,
                state: OPSTATE.NO_OUT
            });
        }

        this.m_pTable.sendMsgToAll('onOutCard', {
            chair: chair,
            cards: cards,
            first: true,
            isMax: this.maxUser == INVALID_CHAIR || this.currentCard[this.maxUser].length != cards.length
        });
        this.currentCard[chair] = cards;

        let next = this.findNext(chair);
        // 不出
        if (cards.length == 0) {
            // 如果下一个玩家是最大玩家结束当轮, 最大玩家出牌, 不是则下一玩家出牌
            if (next == this.maxUser) {
                this.forUser(i => {
                    if (i == chair) return false;
                    this.m_pTable.sendMsgToAll('onOutCard', { chair: i, cards: [], first: false });
                    this.currentCard[i] = [];
                });
                this._operateNotify(this.maxUser);
                this.maxUser = INVALID_CHAIR;
            } else {
                this._operateNotify(next);
            }
        } else {
            if (this.handCard[chair].length == 0) {
                this.firstUser = chair;
                this.m_pTable.sendMsgToAll('onCurrentUser', {
                    chair: INVALID_CHAIR
                });
                return this.concludeGame(chair);
            }
            this.currentCard[chair] = cards;
            this.maxUser = chair;
            this._operateNotify(this.findNext(chair));
        }

        return true;
    }

    private _checkOutCard(cards: number[]): boolean {
        if (cards.length == 0) return true;
        let type = this.gameLogic.getCardType(cards);
        if (type == TYPE.ERROR) return false;
        if (this.maxUser == INVALID_CHAIR) return true;
        else {
            return this.gameLogic.compareCard(cards, this.currentCard[this.maxUser]);
        }
    }


}

