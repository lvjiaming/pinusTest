import { GameState, INVALID_CHAIR } from "../table";
import { DBManager } from './../../repositories/dbManager';
import { Response } from './../../util/response';
import { CHR, IWeaveItem, RULE, WIK } from './define';
import { GameLogic } from "./gameLogic";


// CMD Server
interface IGameStart {
    playerStatus: boolean[];
    bankUser: number;
    lastCardCnt: number;
    hunCard: number;
}

interface IBaseCard {
    cardCnt: number[];
    currentUser: number;
    weaveItem: IWeaveItem[][];
    currentCard: boolean;
}

interface IHandCard {
    handCard: number[];
    currentCard: number;
    isAction?: boolean;
}

interface IOperateNotify {
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

interface IGameConclude {
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

interface IBigEnd {
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

// 常量
const START_SEND = 13;
const GAME_PLAYER = 4;
const LAST_CARD_COUNT = 8;
const MAX_INDEX = 34;
const INVALID_INDEX = -1;


export class CTableSink implements ITableSink {

    // 配置项
    // 带不带一炮多响
    private allFire: boolean = false;
    // 带不带听牌
    private canListen: boolean = true;
    // 带不带吃牌
    private canEat: boolean = true;

    private gameLogic: GameLogic;

    private gameRules: number[] = [];

    private playerStatus: boolean[] = [];

    private currentUser: number = INVALID_CHAIR;

    private provideUser: number = INVALID_CHAIR;

    private providerCard: number = 0; // 当前摸的牌

    private bankUser: number = INVALID_CHAIR; // 庄家
    // 当前牌库
    private repertoryCard: number[] = [];
    // 牌库剩余牌
    private leftCardCnt: number = 0;
    // 玩家手牌
    private cardIndex: number[][] = new Array<number[]>();
    // 玩家推到牌(吃差碰杠)
    private weaveItem: IWeaveItem[][] = new Array<IWeaveItem[]>();
    // 玩家丢弃牌(断线重连显示)
    private discardCard: number[][] = new Array<number[]>();

    private sendCardData: number = 0;
    // 用户出的牌且需要玩家操作
    private outCard: number = 0;
    // 混牌
    private hunCard: number = 0;

    private userOperate: IOperateNotify[][] = new Array<IOperateNotify[]>();
    // 当一张牌有多人操作时, 需要放入保存, 所有人操作完使用
    private operateSave: IOperateNotify[] = [];

    private chiHuRight: number[] = [];

    private prelistenUser: number = INVALID_CHAIR;

    private listenState: boolean[] = [];

    private gangUser: number = INVALID_CHAIR;

    private outHunCnt: number[] = [];

    private splitSendCard: number[] = [];

    private isEnd: boolean = false;
    // 大结算数据
    private zimoCnt: number[] = [];
    private dianpaoCnt: number[] = [];
    private winCnt: number[] = [];
    private totalScore: number[] = [];

    constructor(private m_pTable: ITable) {
        this.gameLogic = new GameLogic();
        // 单体测试
        // let cards = [4, 4, 5, 6, 7, 21, 21, 33, 34, 35];
        // let cardIndex = [];
        // for (let i = 0; i < MAX_INDEX; i++) {
        //     cardIndex[i] = 0;
        // }
        // this.gameLogic.hunIndex = this.gameLogic.switchToCardIndex(9);
        // this.gameLogic.switchToCardIndex(cards, cardIndex);
        // let res = this.gameLogic.analyseChiHu(cardIndex, [{
        //     weaveKind: WIK.PENG,
        //     centerCard: 18,
        //     public: true,
        //     provider: 0,
        //     cardData: [17, 18, 19]
        // } as IWeaveItem], 4);
        // console.log('!!!!!!!!!!!' + JSON.stringify(res));
    }

    private _initRoom() {
        this.playerStatus = [];
        for (let i = 0; i < GAME_PLAYER; i++) {
            if (!!this.m_pTable.sitUser[i]) {
                this.playerStatus[i] = true;
            }
        }
        this.forUser(chair => {
            this.cardIndex[chair] = [];
            for (let j = 0; j < MAX_INDEX; j++) {
                this.cardIndex[chair][j] = 0;
            }
            this.weaveItem[chair] = [];
            this.discardCard[chair] = [];
            this.userOperate[chair] = [];
            this.listenState[chair] = false;
            this.outHunCnt[chair] = 0;
            this.chiHuRight[chair] = CHR.NULL;
            this.splitSendCard[chair] = 0;
        });
        this.gangUser = INVALID_CHAIR;
        this.outCard = 0;
        this.m_pTable.clearTimer('autoStart');
    }

    static getSpend(rules: number[]): number {
        return 0;
    }

    public setRules(gameRules: number[], serverRules: number): void {
        this.gameRules = gameRules;
        this.gameLogic.setRules(gameRules);
    }

    public getMaxChair() {
        return GAME_PLAYER;
    }

    public getUserCnt(): number {
        if (this._hasRule(RULE.PLAYER_2)) return 2;
        else if (this._hasRule(RULE.PLAYER_3)) return 3;
        else return 4;
    }

    public getMaxInning(): number {
        if (this._hasRule(RULE.INNING_20)) return 20;
        else return 30;
    }


    public onEnterUser(chair: number, user: ITableUser): void {
        if (this.bankUser == INVALID_CHAIR) {
            this.bankUser = chair;
        }
        this.zimoCnt[chair] = 0;
        this.dianpaoCnt[chair] = 0;
        this.winCnt[chair] = 0;
        this.totalScore[chair] = 0;
        user.Score += this._hasRule(RULE.SCORE_100) ? 100 : 200;
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
        if (this.bankUser == chair) {
            this.bankUser = this.findNext(chair);
        }
    }

    public onScene(chairID: number): boolean {
        let state: GameState = this.m_pTable.gameState;
        switch (state) {
            case GameState.SCENE_FREE: {
                let obj = {};
                return this.m_pTable.sendMsgByChair(chairID, 'onScenceFree', obj);
            }
            case GameState.SCENE_PLAYING: {
                let obj: IGamePlay = {
                    playerStatus: this.playerStatus,
                    bankUser: this.bankUser,
                    currentUser: this.currentUser,
                    hunCard: this.hunCard,
                    discardCard: this.discardCard,
                    outCard: this.outCard
                };
                this.m_pTable.sendMsgByChair(chairID, 'onScencePlay', obj);
                this._updateCard(chairID)
                // 不需要等待操作
                if (!this.outCard && this.currentUser == chairID) {
                    this.sendUserOutCard(chairID)
                }
                if (this.userOperate[chairID] && this.userOperate[chairID].length > 0) {
                    this.m_pTable.sendMsgByChair(chairID, 'onOperateNotice', this.userOperate[chairID]);
                }
                this.updateAutoTips(chairID);
                // this.forUser(chair => {
                //     this.m_pTable.sendMsgByChair(chairID, 'onUserListen', {
                //         chair: chair,
                //         state: this.listenState[chair],
                //         show: false
                //     });
                // });
            }
            default: {
                console.log('onScence 52200 state:' + state);
            }
        }
        return true;
    }

    public onFrameStart(): boolean {
        // 初始化游戏数据
        this._initRoom();
        this.m_pTable.gameState = GameState.SCENE_PLAYING;

        if (this.bankUser == INVALID_CHAIR) {
            this.bankUser = this.findNext(this.gameLogic.getRandomValue(GAME_PLAYER));
        }
        // 洗牌
        this.repertoryCard = this.gameLogic.shuffle();
        this.leftCardCnt = this.repertoryCard.length;
        // 发牌
        // console.log("牌堆：", this.repertoryCard);
        this.forUser(chair => {
            this.leftCardCnt -= START_SEND;
            var cards = this.repertoryCard.slice(this.leftCardCnt, this.leftCardCnt + START_SEND);
            // cards = [0x01, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x04, 0x04, 0x04];
            this.gameLogic.switchToCardIndex(cards, this.cardIndex[chair]);
        });
        this.hunCard = this.gameLogic.getRandCard();
        // console.log("混牌Card: ", this.hunCard);
        this.gameLogic.hunIndex = this.gameLogic.switchToCardIndex(this.hunCard);
        // console.log("混牌Index: ", this.gameLogic.hunIndex);
        this.m_pTable.sendMsgToAll('onGameStart', {
            playerStatus: this.playerStatus,
            bankUser: this.bankUser,
            lastCardCnt: this.leftCardCnt,
            hunCard: this.hunCard
        } as IGameStart);

        this.forUser(chair => {
            this._sendHandCard(chair);
        });

        this.dispatchCardData(this.bankUser);

        return true;
    }

    public onEventTimer(key: string, param: any): boolean {
        if (key == 'autoStart') {
            this.m_pTable.startGame();
        }
        return true;
    }

    public sendBigEnd() {
        this.m_pTable.sendMsgToAll('onBigEnd', {
            zimoCnt: this.zimoCnt,
            dianpaoCnt: this.dianpaoCnt,
            winCnt: this.winCnt,
            score: this.totalScore
        } as IBigEnd)
    }

    public onOutCard(chair: number, { cardData }: IUserOutCard) {
        if (this.currentUser != chair) {
            console.warn('onOutCard error');
            return false;
        }
        if (this.userOperate[chair]) {
            this.m_pTable.sendMsgByChair(chair, 'onOperateNotice', []);
        }
        this.userOperate = [];
        this.operateSave = [];
        this.provideUser = chair;
        this.providerCard = cardData;
        this.sendCardData = 0;

        let idx = this.gameLogic.switchToCardIndex(cardData);
        if (this.cardIndex[chair][idx] == 0) {
            console.warn('onOutCard error cannot find ' + cardData);
            return;
        }
        this.cardIndex[chair][idx]--;
        // if (this.prelistenUser == chair) {
        //     this.updateListen(chair);
        //     this.prelistenUser = INVALID_CHAIR;
        // } else if (this.listenState[chair]) {
        //     this.updateListen(chair);
        // }
        this.updateAutoTips(chair);
        this.m_pTable.sendMsgToAll('onSendCard', {
            cardData: cardData,
            chair: chair
        });
        this._updateCard(chair);
        this.outCard = cardData;
        if (!this.sendOperateNotice()) {
            if (this.hunCard == cardData) this.outHunCnt[chair]++;
            this.gangUser = INVALID_CHAIR;
            this.sendFallCard();
            this.dispatchCardData(this.findNext(chair));
        }
        return true;
    }

    private updateListen(chair: number) {
        let res = this.gameLogic.analyseHuCard(this.cardIndex[chair], this.weaveItem[chair], true);
        let state = res.length != 0;
        if (this.listenState[chair] != state) {
            this.m_pTable.sendMsgToAll('onUserListen', {
                chair: chair,
                state: state
            });
            this.listenState[chair] = state;
        }
    }

    private updateAutoTips(chair: number, isCancle: boolean = false): void {
        if (isCancle || (this.gameLogic.getCardCnt(this.cardIndex[chair]) - 2 % 3) == 0) {
            this.m_pTable.sendMsgByChair(chair, 'updateAutoTips', {});
        }
        let res = this.gameLogic.analyseHuCard(this.cardIndex[chair], this.weaveItem[chair]);
        let obj: { [key: number]: number } = {};
        res.forEach(card => { obj[card] = this.getLeftCard(chair, card) });
        this.m_pTable.sendMsgByChair(chair, 'updateAutoTips', obj);
    }

    private sendFallCard() {
        this.discardCard[this.provideUser].push(this.providerCard);
        this.m_pTable.sendMsgToAll('onSendCardFall', {
            cardData: this.providerCard,
            chair: this.provideUser
        });
    }

    // for onOperate 获取最大权位玩家, 仅在onOperate中使用
    // 返回值为数组, 无最大权位玩家返回[], 一炮多响时返回能胡的玩家, 其他返回一个玩家[chair]
    private findTagetUser(chair: number): number[] {
        if (chair == this.provideUser) return this.operateSave[chair] ? [chair] : [];
        let maxAction = WIK.NULL;
        let getMaxAction = (chair: number) => {
            let act = WIK.NULL;
            if (this.userOperate[chair]) {
                for (let i of this.userOperate[chair]) {
                    if (i.actionMask > act) {
                        act = i.actionMask;
                    }
                }
            }
            return act;
        };
        let user = [];
        for (let i = this.findNext(this.provideUser); i != this.provideUser; i = this.findNext(i)) {
            if (!this.playerStatus[i]) continue;
            let act = this.operateSave[i] ? this.operateSave[i].actionMask : getMaxAction(i);
            // 一炮多响
            if (act == WIK.CHI_HU && maxAction == WIK.CHI_HU && this.allFire) {
                user.push(i);
            }
            if (act > maxAction) {
                maxAction = act;
                user[0] = i;
            }
        }
        return user;
    }

    public onOperate(chair: number, { index }: IUserOperate) {
        let operate = this.userOperate[chair][index];
        // 听
        if (operate && operate.actionMask == WIK.LISTEN) {
            this.prelistenUser = chair;
            this.m_pTable.sendMsgByChair(chair, 'onOperateNotice', []);
            return true;
        }
        this.userOperate[chair] = [];
        this.m_pTable.sendMsgByChair(chair, 'onOperateNotice', this.userOperate[chair]);

        // 过 operate = null 不保存
        if (operate) {
            this.operateSave[chair] = operate;
        }
        let users = this.findTagetUser(chair);
        // 判断关键玩家是否操作, 没操作需要等待
        for (let user of users) {
            if (this.userOperate[user].length != 0) {
                return true;
            }
        }
        this.forUser(user => {
            if (this.userOperate[user] && this.userOperate[user].length > 0) {
                this.m_pTable.sendMsgByChair(user, 'onOperateNotice', []);
            }
        });
        this.userOperate = [];
        this.outCard = 0;
        if (users.length > 0) {
            // 只有一炮多响才发送多个动作给前端, 其他只保留一个动作
            if (users.length == 1) {
                for (let i in this.operateSave) {
                    if (parseInt(i) == users[0]) continue;
                    this.operateSave[i] = null;
                }
            }
            this.m_pTable.sendMsgToAll('onUserOperate', this.operateSave);
        }

        if (users.length != 0) {
            this.updateAutoTips(chair, true);
        }

        // 胡
        if (users.length > 1 || (users.length == 1 && this.operateSave[users[0]].actionMask == WIK.CHI_HU)) {
            for (var i of users) {
                if (this.provideUser == i) {
                    this.cardIndex[i][this.gameLogic.switchToCardIndex(this.providerCard)]--;
                }
                this.chiHuRight[i] = this.gameLogic.analyseChiHu(this.cardIndex[i], this.weaveItem[i], this.providerCard);
            }
            this.operateSave = [];
            return this.concludeGame(INVALID_CHAIR);
        }
        this.gangUser = INVALID_CHAIR;
        // 吃 碰 杠
        if (users.length == 1) {
            let user = users[0];
            operate = this.operateSave[user];
            this.operateSave = [];
            // 补杠
            if (operate.actionMask == WIK.GANG && operate.cards.length == 1) {
                for (let weave of this.weaveItem[user]) {
                    if (weave.weaveKind == WIK.PENG && weave.centerCard == operate.centerCard) {
                        weave.weaveKind = WIK.GANG;
                        weave.cardData = this.gameLogic.getWeaveCard(WIK.GANG, weave.centerCard);
                        weave.provider = user;
                        this.cardIndex[user][this.gameLogic.switchToCardIndex(weave.centerCard)]--;
                        // 如果抓的牌不是补杠的牌听口会变取消听
                        // if (this.listenState[chair] && weave.centerCard != this.sendCardData) {
                        //     this.listenState[chair] = false;
                        //     this.m_pTable.sendMsgToAll('onUserListen', {
                        //         chair: chair,
                        //         state: false
                        //     });
                        // }
                        this.dispatchCardData(user, true);
                        this.gangUser = user;
                        return true
                    }
                }
            }
            let isOpen = this.gameLogic.isOpen(this.weaveItem[user]);
            // 吃 碰 明杠 暗杠
            let weaveItem: IWeaveItem = {
                weaveKind: operate.actionMask,
                centerCard: operate.centerCard,
                public: (operate.actionMask == WIK.GANG && operate.cards[0] == 0 && !isOpen) ? false : true,
                provider: this.provideUser,
                cardData: this.gameLogic.getWeaveCard(operate.actionMask, operate.centerCard),
                show: isOpen
            };
            this.weaveItem[user].push(weaveItem);
            if (weaveItem.public == true) {
                this._updateGangView(user);
            };
            // 剔除手牌
            let cards = weaveItem.cardData.slice(0);
            let isDel = false;
            cards.forEach(card => {
                // 如果操作别人打出来的牌,跳过中心牌
                if (this.provideUser != user && card == weaveItem.centerCard && !isDel) {
                    isDel = true;
                    return;
                }
                let idx = this.gameLogic.switchToCardIndex(card);
                if (this.cardIndex[user][idx] == 0) {
                    console.warn('onOperate error cannot find ' + card);
                    return;
                }
                this.cardIndex[user][idx]--;
            });
            // 更新手牌
            this._updateCard(user);
            // 杠发牌
            if (weaveItem.weaveKind == WIK.GANG) {
                // 暗会改变听口，取消听
                // if (weaveItem.public == false && this.listenState[chair]) {
                //     this.listenState[chair] = false;
                //     this.m_pTable.sendMsgToAll('onUserListen', {
                //         chair: chair,
                //         state: false
                //     });
                // }
                this.dispatchCardData(user, true);
                this.gangUser = user;
                return true
            }
            // 吃 碰 出牌
            this.sendUserOutCard(user)
            this.provideUser = user;
            this.providerCard = 0;
            this.outCard = 0;
            this.sendOperateNotice();
            return true;
        }

        // 过
        if (users.length == 0) {
            if (chair != this.provideUser) {
                this.sendFallCard();
                this.dispatchCardData(this.findNext(this.currentUser))
            } else if (this.listenState[chair]) {
                this.onOutCard(chair, { cardData: this.sendCardData });
            }
        }
        return true;
    }

    public onListenCard(chair: number, { cardData }: { cardData: number }) {
        let idx = this.gameLogic.switchToCardIndex(cardData);
        this.cardIndex[chair][idx]--;
        let hunCard = this.gameLogic.analyseHuCard(this.cardIndex[chair], this.weaveItem[chair]);
        this.cardIndex[chair][idx]++;
        let obj: { [key: number]: { cnt: number } } = {};
        for (let card of hunCard) {
            obj[card] = {
                cnt: this.getLeftCard(chair, card),
            };
        }
        this.m_pTable.sendMsgByChair(chair, 'onListenTips', obj);
        return true;
    }

    private getLeftCard(chair: number, card: number) {
        let maxCnt = 4;
        maxCnt -= this.cardIndex[chair][this.gameLogic.switchToCardIndex(card)];
        this.forUser(i => {
            this.weaveItem[i].forEach(item => {
                if (item.public || item.show) {
                    item.cardData.forEach(c => {
                        if (c == card) maxCnt--;
                    });
                }
            });
            this.discardCard[i].forEach(c => {
                if (c == card) maxCnt--;
            });
        });
        if (maxCnt < 0) {
            console.log('getLeftCard error ' + chair + ' ' + card);
            return 0;
        }
        return maxCnt;
    }

    private _updateGangView(user: number) {
        for (let item of this.weaveItem[user]) {
            if (item.public == false && item.weaveKind == WIK.GANG) {
                item.show = true;
            }
        }
    }

    public concludeGame(chair: number, isDiss?: boolean) {
        let cards: number[][] = [];
        let score = this.calScore();
        // let revenue: number[] = [];
        this.forUser(user => {
            cards[user] = this.gameLogic.switchToCardData(this.cardIndex[user]);
            if (this.chiHuRight[user] != CHR.NULL) {
                this.winCnt[user]++;
                if (this.provideUser == user) {
                    this.zimoCnt[user]++;
                } else {
                    this.dianpaoCnt[this.provideUser]++;
                }
            }
            this.totalScore[user] += score[user];
            // if (this.m_pTable.roomInfo.ClubKey) {
            //     revenue[user] = (this.m_pTable.roomInfo.Process == 1 && !isDiss) ? this.gameRules[1] : 0;
            // }
            if (isDiss && (cards[user].length - 2) % 3 == 0 && this.splitSendCard[user] == 0) {
                this.splitSendCard[user] = cards[user].splice(-1)[0];
            }
        });
        this.m_pTable.sendMsgToAll('onGameConclude', {
            playerStatus: this.playerStatus,
            handCard: cards,
            weaveItem: this.weaveItem,
            chiHuRight: this.chiHuRight,
            provider: this.provideUser,
            providCard: this.providerCard,
            score: score,
            hunCard: this.hunCard,
            splitCard: this.splitSendCard,
            outHunCnt: this.outHunCnt,
            bankUser: this.bankUser
        } as IGameConclude);
        if (this.m_pTable.roomInfo.ClubKey &&this.m_pTable.roomInfo.Process == 1 && !isDiss) {
            this.forUser(i=> {
                score[i] -= this.gameRules[1];
            })
        }
        this.m_pTable.writeScore(score, null);
        if (this.chiHuRight[this.bankUser] == CHR.NULL) this.bankUser = this.findNext(this.bankUser);
        this.m_pTable.concludeGame(this.isEnd || isDiss);
        if (!this.isEnd && !isDiss) {
            this.m_pTable.setTimer('autoStart', 12000);
        }
        return true;
    }

    private calScore() {
        let userScore: number[] = [];
        this.forUser(chair => {
            userScore[chair] = 0;
        });
        this.forUser(winChair => {
            if (this.chiHuRight[winChair] == CHR.NULL) return;
            this.forUser(loseChair => {
                if (winChair == loseChair) return;
                if (this.chiHuRight[loseChair] != CHR.NULL) return;
                let score = this.getLoseScore(winChair, loseChair);
                // 自摸 点炮坐车
                if (this.provideUser == winChair || this._hasRule(RULE.FIRE_3_PAY)) {
                    userScore[loseChair] -= score;
                }
                // 点炮包三家
                if (this.provideUser != winChair && this._hasRule(RULE.FIRE_PAY_3)) {
                    userScore[this.provideUser] -= score;
                }
                // 点炮一家付
                // if (loseChair == this.provideUser) {
                //     userScore[loseChair] -= score;
                //     userScore[winChair] += score;
                //     return true;
                // }
            });
            this.forUser(chair => {
                if (chair == winChair) return;
                let score = -userScore[chair];
                if (this.m_pTable.sitUser[chair].Score <= score) {
                    score = this.m_pTable.sitUser[chair].Score;
                    // 给房费预留出来
                    if (this.m_pTable.roomInfo.ClubKey &&this.m_pTable.roomInfo.Process == 1) {
                        score -= this.gameRules[1]
                    }
                    userScore[chair] = -score;
                    this.isEnd = true;
                }
                userScore[winChair] += score;
            });
            // 不是一炮多响找到胡牌玩家直接跳出循环
            return !this.allFire;
        });
        return userScore;
    }

    // 牌型番数 (分开是为了听牌提示)
    private getChiHuTimes(chiHuRight: number) {
        // [条件, 番数]
        let list: [boolean, number][] = [
            // 手把一
            [(chiHuRight & CHR.BA_1) > 0, 1],
            // 清一色
            [(chiHuRight & CHR.QING_YI_SE) > 0, 2],
            // 独门
            [(chiHuRight & CHR.DU_MEN) > 0, 1],
        ];

        let times = 0;
        if (chiHuRight & CHR.PIAO) {
            times = 3;
        } else if (chiHuRight & (CHR.BAI_JIA | CHR.CHUN_JIA)) {
            times = 2;
        } else {
            times = 1;
        }
        times += this._callTimes(list);
        return times;
    }

    private getLoseScore(winChair: number, loseChair: number) {
        // [条件, 番数]
        let list: [boolean, number][] = [
            // 杠开
            [this.gangUser == winChair && this.provideUser == winChair, 1],
            // 流泪
            [this._hasRule(RULE.TEAR) && this.gangUser == this.provideUser && winChair != this.provideUser, 1],
            // 庄家
            [this.bankUser == winChair || loseChair == this.bankUser, 1],
            // 点炮
            [this.provideUser == loseChair, 1],
            // 自摸
            [this.provideUser == winChair, 1],
            // 三家站
            [this.is3BiMen(winChair), 1],
            // 打混
            [this.outHunCnt[winChair] > 0, this.outHunCnt[winChair]]
        ];

        let scoreList = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

        let times = this.getChiHuTimes(this.chiHuRight[winChair])

        times += this._callTimes(list);

        if (this.chiHuRight[winChair] != CHR.NULL) {
            if (this.is3BiMen(winChair)) this.chiHuRight[winChair] |= CHR.MEN_DA_3;
            if (this.gangUser == winChair && this.provideUser == winChair) this.chiHuRight[winChair] |= CHR.GANG_KAI;
        }
        let score = scoreList[times];
        if (score == null) score = 1000;
        return score;
    }

    private _callTimes(list: [boolean, number][]) {
        let times = 0;
        for (let i in list) {
            if (list[i][0]) {
                times += list[i][1];
            }
        }
        return times;
    }

    // 是否三家站
    private is3BiMen(winChair: number) {
        if (this._hasRule(RULE.PLAYER_4)) {
            for (let i = 0; i < this.weaveItem.length; i++) {
                if (i == winChair) continue;
                if (this.gameLogic.isOpen(this.weaveItem[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    private splitCard(chair: number, firstChair: number) {
        if (this.leftCardCnt < 0) {
            console.warn('dispatchCardData err ' + this.leftCardCnt)
            return false;
        }
        this.sendCardData = this.repertoryCard[--this.leftCardCnt];
        this.cardIndex[chair][this.gameLogic.switchToCardIndex(this.sendCardData)]++;
        this.splitSendCard[chair] = this.sendCardData;
        this._updateCard(chair);
        let next = this.findNext(chair);
        if (next != firstChair) {
            setTimeout(this.splitCard.bind(this, next, firstChair), 1000);
        } else {
            this.provideUser = INVALID_CHAIR;
            this.providerCard = 0;
            for (let i = firstChair, j = 0; i != firstChair || j == 0; i = this.findNext(i), j++) {
                this.cardIndex[i][this.gameLogic.switchToCardIndex(this.splitSendCard[i])]--;
                this.chiHuRight[i] = this.gameLogic.analyseChiHu(this.cardIndex[i],
                    this.weaveItem[i], this.splitSendCard[i]);
                if (CHR.NULL != this.chiHuRight[i]) {
                    this.provideUser = i;
                    this.providerCard = this.splitSendCard[i];
                    if (!this.allFire) break;
                }
            }
            setTimeout(this.concludeGame.bind(this, INVALID_CHAIR), 1000);
        }
    }

    private dispatchCardData(chair: number, isAnGang?: boolean) {
        // 分张
        if (this.leftCardCnt <= LAST_CARD_COUNT) {
            if (this._hasRule(RULE.SEA_MOON)) {
                setTimeout(this.splitCard.bind(this, chair, chair), 1000);
            } else {
                this.concludeGame(INVALID_CHAIR);
            }
            return true;
        }

        this.sendCardData = this.repertoryCard[--this.leftCardCnt];
        this.m_pTable.sendMsgToAll('onUpdateLeftCnt', this.leftCardCnt);

        this.currentUser = chair;
        this.provideUser = chair;
        this.providerCard = this.sendCardData;
        this.outCard = 0;

        this.cardIndex[chair][this.gameLogic.switchToCardIndex(this.sendCardData)]++;
        let res = this._currentOperateNotice();
        // 如果单独是听牌不用通知前端
        let condition = res[chair] && res[chair].length == 1 && res[chair][0].actionMask == WIK.LISTEN;
        if (!this.listenState[chair]) {
            this.sendUserOutCard(chair);
        }
        this._updateCard(chair, !condition && res[chair].length > 0);
        this._sendOperate(res);
        if (res[chair].length == 0 && (this.listenState[chair])) {
            setTimeout(this.onOutCard.bind(this, chair, { cardData: this.providerCard }), 1000);
            // this.onOutCard(chair, { cardData: this.providerCard });
        }
        return true;
    }

    private sendUserOutCard(chair: number) {
        this.currentUser = chair;
        this.outCard = 0;
        this.m_pTable.sendMsgToAll('onUserCanOut', {
            currentUser: chair
        });
        return true;
    }

    private sendOperateNotice() {
        let res: IOperateNotify[][];
        if (this.outCard == 0) {
            res = this._currentOperateNotice();
        } else {
            res = this._otherOperateNotice();
        }
        return this._sendOperate(res);
    }

    private _sendOperate(res: IOperateNotify[][]): boolean {
        let isSend = false;
        this.forUser(i=> {
            if (res[i] && res[i].length > 0) {
                this.userOperate[i] = res[i];
                this.m_pTable.sendMsgByChair(i, 'onOperateNotice', res[i]);
                isSend = true;
            }
        })
        return isSend;
    }

    // 暗杠 补杠 听牌 胡牌
    private _currentOperateNotice(): IOperateNotify[][] {
        let res: IOperateNotify[][] = [];
        let chair = this.currentUser;
        res[chair] = [];
        let results: IOperateNotify[] = res[chair];
        // 胡牌
        if (this.providerCard != 0) {
            this.cardIndex[chair][this.gameLogic.switchToCardIndex(this.providerCard)]--;
            if (CHR.NULL != this.gameLogic.analyseChiHu(this.cardIndex[chair],
                this.weaveItem[chair], this.providerCard)) {
                results.push({
                    actionMask: WIK.CHI_HU,
                    centerCard: this.providerCard,
                    cards: [this.providerCard]
                });
            }
            this.cardIndex[chair][this.gameLogic.switchToCardIndex(this.providerCard)]++;
        }
        // 听牌
        if (this.canListen && !this.listenState[chair]) {
            let tingCard = this.gameLogic.analyseTingCard(this.cardIndex[chair], this.weaveItem[chair]);
            if (tingCard.length != 0) {
                results.push({
                    actionMask: WIK.LISTEN,
                    centerCard: 0,
                    cards: tingCard
                });
            }
        }

        // 杠牌
        let gangCards = this.gameLogic.analyzeGangCard(this.cardIndex[chair], this.weaveItem[chair]);
        if (gangCards.length != 0) {
            gangCards.forEach(cards => {
                results.push({
                    actionMask: WIK.GANG,
                    centerCard: cards[0] ? cards[0] : cards[3],
                    cards: cards
                });
            })
        }
        return res;
    }

    // 明杠 吃 碰 胡
    private _otherOperateNotice(): IOperateNotify[][] {
        let res: IOperateNotify[][] = [];
        this.forUser(chair => {
            if (chair == this.provideUser) return;
            res[chair] = [];
            let results = res[chair];
            // 胡牌
            if (CHR.NULL != this.gameLogic.analyseChiHu(this.cardIndex[chair],
                this.weaveItem[chair], this.providerCard)) {
                results.push({
                    actionMask: WIK.CHI_HU,
                    centerCard: this.providerCard,
                    cards: [this.providerCard]
                });
            }
            // 杠牌
            let gangCards = this.gameLogic.analyzeGangCard(this.cardIndex[chair], this.providerCard);
            if (gangCards.length != 0) {
                gangCards.forEach(cards => {
                    results.push({
                        actionMask: WIK.GANG,
                        centerCard: cards[0] ? cards[0] : cards[3],
                        cards: cards
                    });
                })
            }
            if (!this.listenState[chair]) {
                // 碰牌
                if (this.gameLogic.analysePengCard(this.cardIndex[chair], this.providerCard)) {
                    results.push({
                        actionMask: WIK.PENG,
                        centerCard: this.providerCard,
                        cards: [this.providerCard, this.providerCard, this.providerCard]
                    });
                }
                // 吃牌
                if (this.canEat && this.findNext(this.provideUser) == chair) {
                    let chiRes = this.gameLogic.analyseEatCard(this.cardIndex[chair], this.providerCard);
                    if (chiRes != WIK.NULL) {
                        for (let i = 0; i < 3; i++) {
                            let wik = (1 << i);    // WIK.LEFT WIK.CENTER WIK.RIGHT
                            if (chiRes & wik) {
                                results.push({
                                    actionMask: wik,
                                    centerCard: this.providerCard,
                                    cards: this.gameLogic.getWeaveCard(wik, this.providerCard)
                                });
                            }
                        }
                    }
                }
            }
        });
        return res;
    }

    private _updateCard(chair: number, isAction?: boolean) {
        // let cnt = this.gameLogic.getCardCnt(this.cardIndex[chair]);
        // let sendCard = (cnt - 2) % 3 == 0;
        this._sendBaseCard();
        this._sendHandCard(chair, isAction);
    }

    private _sendHandCard(chair: number, isAction?: boolean): void {
        let cards = this.gameLogic.switchToCardData(this.cardIndex[chair]);
        let curCard = 0;
        if ((cards.length - 2) % 3 == 0) {
            for (let i = 0; i < cards.length; i++) {
                if (cards[i] == this.sendCardData) {
                    cards.splice(i, 1);
                    break;
                }
            }
            curCard = this.sendCardData ? this.sendCardData : cards.splice(-1, 1)[0];
        }
        this.m_pTable.sendMsgByChair(chair, 'onHandCard', {
            handCard: cards,
            currentCard: curCard,
            isAction: isAction
        } as IHandCard);
    }

    private _sendBaseCard() {
        var cardCnt: number[] = [];
        this.forUser(chair => {
            cardCnt[chair] = this.gameLogic.getCardCnt(this.cardIndex[chair]);
        });
        this.m_pTable.sendMsgToAll('onBaseCard', {
            cardCnt: cardCnt,
            currentUser: this.currentUser,
            weaveItem: this.weaveItem,
        } as IBaseCard)
    }

    private forUser(call: (chair: number) => void | boolean) {
        for (var i in this.playerStatus) {
            if (call(parseInt(i))) break;
        }
    }

    private findNext(chair: number) {
        for (var i = 0; i < GAME_PLAYER; i++) {
            var next = (chair + i + 1) % GAME_PLAYER;
            if (!!this.m_pTable.sitUser[next]) return next;
        }
        return INVALID_CHAIR;
    }

    private _hasRule(rule: number) {
        return (this.gameRules[0] & rule) > 0;
    }
}

