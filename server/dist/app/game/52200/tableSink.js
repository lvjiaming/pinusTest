"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTableSink = void 0;
const table_1 = require("../table");
const dbManager_1 = require("./../../repositories/dbManager");
const response_1 = require("./../../util/response");
const define_1 = require("./define");
const gameLogic_1 = require("./gameLogic");
// 常量
const START_SEND = 13;
const GAME_PLAYER = 4;
const LAST_CARD_COUNT = 8;
const MAX_INDEX = 34;
const INVALID_INDEX = -1;
class CTableSink {
    constructor(m_pTable) {
        this.m_pTable = m_pTable;
        // 配置项
        // 带不带一炮多响
        this.allFire = false;
        // 带不带听牌
        this.canListen = true;
        // 带不带吃牌
        this.canEat = true;
        this.gameRules = [];
        this.playerStatus = [];
        this.currentUser = table_1.INVALID_CHAIR;
        this.provideUser = table_1.INVALID_CHAIR;
        this.providerCard = 0; // 当前摸的牌
        this.bankUser = table_1.INVALID_CHAIR; // 庄家
        // 当前牌库
        this.repertoryCard = [];
        // 牌库剩余牌
        this.leftCardCnt = 0;
        // 玩家手牌
        this.cardIndex = new Array();
        // 玩家推到牌(吃差碰杠)
        this.weaveItem = new Array();
        // 玩家丢弃牌(断线重连显示)
        this.discardCard = new Array();
        this.sendCardData = 0;
        // 用户出的牌且需要玩家操作
        this.outCard = 0;
        // 混牌
        this.hunCard = 0;
        this.userOperate = new Array();
        // 当一张牌有多人操作时, 需要放入保存, 所有人操作完使用
        this.operateSave = [];
        this.chiHuRight = [];
        this.prelistenUser = table_1.INVALID_CHAIR;
        this.listenState = [];
        this.gangUser = table_1.INVALID_CHAIR;
        this.outHunCnt = [];
        this.splitSendCard = [];
        this.isEnd = false;
        // 大结算数据
        this.zimoCnt = [];
        this.dianpaoCnt = [];
        this.winCnt = [];
        this.totalScore = [];
        this.gameLogic = new gameLogic_1.GameLogic();
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
    _initRoom() {
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
            this.chiHuRight[chair] = define_1.CHR.NULL;
            this.splitSendCard[chair] = 0;
        });
        this.gangUser = table_1.INVALID_CHAIR;
        this.outCard = 0;
        this.m_pTable.clearTimer('autoStart');
    }
    static getSpend(rules) {
        return 0;
    }
    setRules(gameRules, serverRules) {
        this.gameRules = gameRules;
        this.gameLogic.setRules(gameRules);
    }
    getMaxChair() {
        return GAME_PLAYER;
    }
    getUserCnt() {
        if (this._hasRule(define_1.RULE.PLAYER_2))
            return 2;
        else if (this._hasRule(define_1.RULE.PLAYER_3))
            return 3;
        else
            return 4;
    }
    getMaxInning() {
        if (this._hasRule(define_1.RULE.INNING_20))
            return 20;
        else
            return 30;
    }
    onEnterUser(chair, user) {
        if (this.bankUser == table_1.INVALID_CHAIR) {
            this.bankUser = chair;
        }
        this.zimoCnt[chair] = 0;
        this.dianpaoCnt[chair] = 0;
        this.winCnt[chair] = 0;
        this.totalScore[chair] = 0;
        user.Score += this._hasRule(define_1.RULE.SCORE_100) ? 100 : 200;
    }
    async onCheckEnter(userID) {
        if (!this.m_pTable.roomInfo.ClubKey)
            return true;
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(this.m_pTable.roomInfo.ClubKey, userID);
        let score = this._hasRule(define_1.RULE.SCORE_100) ? 100 : 200;
        // score += this.gameRules[1];
        if (userInfo.Score < score) {
            this.m_pTable.sendMsgByUserID(userID, 'onErrMsg', response_1.Response.ERROR('您的积分不足无法进入房间'));
            return false;
        }
        return true;
    }
    onLeaveUser(chair) {
        if (this.bankUser == chair) {
            this.bankUser = this.findNext(chair);
        }
    }
    onScene(chairID) {
        let state = this.m_pTable.gameState;
        switch (state) {
            case table_1.GameState.SCENE_FREE: {
                let obj = {};
                return this.m_pTable.sendMsgByChair(chairID, 'onScenceFree', obj);
            }
            case table_1.GameState.SCENE_PLAYING: {
                let obj = {
                    playerStatus: this.playerStatus,
                    bankUser: this.bankUser,
                    currentUser: this.currentUser,
                    hunCard: this.hunCard,
                    discardCard: this.discardCard,
                    outCard: this.outCard
                };
                this.m_pTable.sendMsgByChair(chairID, 'onScencePlay', obj);
                this._updateCard(chairID);
                // 不需要等待操作
                if (!this.outCard && this.currentUser == chairID) {
                    this.sendUserOutCard(chairID);
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
    onFrameStart() {
        // 初始化游戏数据
        this._initRoom();
        this.m_pTable.gameState = table_1.GameState.SCENE_PLAYING;
        if (this.bankUser == table_1.INVALID_CHAIR) {
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
        });
        this.forUser(chair => {
            this._sendHandCard(chair);
        });
        this.dispatchCardData(this.bankUser);
        return true;
    }
    onEventTimer(key, param) {
        if (key == 'autoStart') {
            this.m_pTable.startGame();
        }
        return true;
    }
    sendBigEnd() {
        this.m_pTable.sendMsgToAll('onBigEnd', {
            zimoCnt: this.zimoCnt,
            dianpaoCnt: this.dianpaoCnt,
            winCnt: this.winCnt,
            score: this.totalScore
        });
    }
    onOutCard(chair, { cardData }) {
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
            if (this.hunCard == cardData)
                this.outHunCnt[chair]++;
            this.gangUser = table_1.INVALID_CHAIR;
            this.sendFallCard();
            this.dispatchCardData(this.findNext(chair));
        }
        return true;
    }
    updateListen(chair) {
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
    updateAutoTips(chair, isCancle = false) {
        if (isCancle || (this.gameLogic.getCardCnt(this.cardIndex[chair]) - 2 % 3) == 0) {
            this.m_pTable.sendMsgByChair(chair, 'updateAutoTips', {});
        }
        let res = this.gameLogic.analyseHuCard(this.cardIndex[chair], this.weaveItem[chair]);
        let obj = {};
        res.forEach(card => { obj[card] = this.getLeftCard(chair, card); });
        this.m_pTable.sendMsgByChair(chair, 'updateAutoTips', obj);
    }
    sendFallCard() {
        this.discardCard[this.provideUser].push(this.providerCard);
        this.m_pTable.sendMsgToAll('onSendCardFall', {
            cardData: this.providerCard,
            chair: this.provideUser
        });
    }
    // for onOperate 获取最大权位玩家, 仅在onOperate中使用
    // 返回值为数组, 无最大权位玩家返回[], 一炮多响时返回能胡的玩家, 其他返回一个玩家[chair]
    findTagetUser(chair) {
        if (chair == this.provideUser)
            return this.operateSave[chair] ? [chair] : [];
        let maxAction = define_1.WIK.NULL;
        let getMaxAction = (chair) => {
            let act = define_1.WIK.NULL;
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
            if (!this.playerStatus[i])
                continue;
            let act = this.operateSave[i] ? this.operateSave[i].actionMask : getMaxAction(i);
            // 一炮多响
            if (act == define_1.WIK.CHI_HU && maxAction == define_1.WIK.CHI_HU && this.allFire) {
                user.push(i);
            }
            if (act > maxAction) {
                maxAction = act;
                user[0] = i;
            }
        }
        return user;
    }
    onOperate(chair, { index }) {
        let operate = this.userOperate[chair][index];
        // 听
        if (operate && operate.actionMask == define_1.WIK.LISTEN) {
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
                    if (parseInt(i) == users[0])
                        continue;
                    this.operateSave[i] = null;
                }
            }
            this.m_pTable.sendMsgToAll('onUserOperate', this.operateSave);
        }
        if (users.length != 0) {
            this.updateAutoTips(chair, true);
        }
        // 胡
        if (users.length > 1 || (users.length == 1 && this.operateSave[users[0]].actionMask == define_1.WIK.CHI_HU)) {
            for (var i of users) {
                if (this.provideUser == i) {
                    this.cardIndex[i][this.gameLogic.switchToCardIndex(this.providerCard)]--;
                }
                this.chiHuRight[i] = this.gameLogic.analyseChiHu(this.cardIndex[i], this.weaveItem[i], this.providerCard);
            }
            this.operateSave = [];
            return this.concludeGame(table_1.INVALID_CHAIR);
        }
        this.gangUser = table_1.INVALID_CHAIR;
        // 吃 碰 杠
        if (users.length == 1) {
            let user = users[0];
            operate = this.operateSave[user];
            this.operateSave = [];
            // 补杠
            if (operate.actionMask == define_1.WIK.GANG && operate.cards.length == 1) {
                for (let weave of this.weaveItem[user]) {
                    if (weave.weaveKind == define_1.WIK.PENG && weave.centerCard == operate.centerCard) {
                        weave.weaveKind = define_1.WIK.GANG;
                        weave.cardData = this.gameLogic.getWeaveCard(define_1.WIK.GANG, weave.centerCard);
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
                        return true;
                    }
                }
            }
            let isOpen = this.gameLogic.isOpen(this.weaveItem[user]);
            // 吃 碰 明杠 暗杠
            let weaveItem = {
                weaveKind: operate.actionMask,
                centerCard: operate.centerCard,
                public: (operate.actionMask == define_1.WIK.GANG && operate.cards[0] == 0 && !isOpen) ? false : true,
                provider: this.provideUser,
                cardData: this.gameLogic.getWeaveCard(operate.actionMask, operate.centerCard),
                show: isOpen
            };
            this.weaveItem[user].push(weaveItem);
            if (weaveItem.public == true) {
                this._updateGangView(user);
            }
            ;
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
            if (weaveItem.weaveKind == define_1.WIK.GANG) {
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
                return true;
            }
            // 吃 碰 出牌
            this.sendUserOutCard(user);
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
                this.dispatchCardData(this.findNext(this.currentUser));
            }
            else if (this.listenState[chair]) {
                this.onOutCard(chair, { cardData: this.sendCardData });
            }
        }
        return true;
    }
    onListenCard(chair, { cardData }) {
        let idx = this.gameLogic.switchToCardIndex(cardData);
        this.cardIndex[chair][idx]--;
        let hunCard = this.gameLogic.analyseHuCard(this.cardIndex[chair], this.weaveItem[chair]);
        this.cardIndex[chair][idx]++;
        let obj = {};
        for (let card of hunCard) {
            obj[card] = {
                cnt: this.getLeftCard(chair, card),
            };
        }
        this.m_pTable.sendMsgByChair(chair, 'onListenTips', obj);
        return true;
    }
    getLeftCard(chair, card) {
        let maxCnt = 4;
        maxCnt -= this.cardIndex[chair][this.gameLogic.switchToCardIndex(card)];
        this.forUser(i => {
            this.weaveItem[i].forEach(item => {
                if (item.public || item.show) {
                    item.cardData.forEach(c => {
                        if (c == card)
                            maxCnt--;
                    });
                }
            });
            this.discardCard[i].forEach(c => {
                if (c == card)
                    maxCnt--;
            });
        });
        if (maxCnt < 0) {
            console.log('getLeftCard error ' + chair + ' ' + card);
            return 0;
        }
        return maxCnt;
    }
    _updateGangView(user) {
        for (let item of this.weaveItem[user]) {
            if (item.public == false && item.weaveKind == define_1.WIK.GANG) {
                item.show = true;
            }
        }
    }
    concludeGame(chair, isDiss) {
        let cards = [];
        let score = this.calScore();
        // let revenue: number[] = [];
        this.forUser(user => {
            cards[user] = this.gameLogic.switchToCardData(this.cardIndex[user]);
            if (this.chiHuRight[user] != define_1.CHR.NULL) {
                this.winCnt[user]++;
                if (this.provideUser == user) {
                    this.zimoCnt[user]++;
                }
                else {
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
        });
        if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1 && !isDiss) {
            this.forUser(i => {
                score[i] -= this.gameRules[1];
            });
        }
        this.m_pTable.writeScore(score, null);
        if (this.chiHuRight[this.bankUser] == define_1.CHR.NULL)
            this.bankUser = this.findNext(this.bankUser);
        this.m_pTable.concludeGame(this.isEnd || isDiss);
        if (!this.isEnd && !isDiss) {
            this.m_pTable.setTimer('autoStart', 12000);
        }
        return true;
    }
    calScore() {
        let userScore = [];
        this.forUser(chair => {
            userScore[chair] = 0;
        });
        this.forUser(winChair => {
            if (this.chiHuRight[winChair] == define_1.CHR.NULL)
                return;
            this.forUser(loseChair => {
                if (winChair == loseChair)
                    return;
                if (this.chiHuRight[loseChair] != define_1.CHR.NULL)
                    return;
                let score = this.getLoseScore(winChair, loseChair);
                // 自摸 点炮坐车
                if (this.provideUser == winChair || this._hasRule(define_1.RULE.FIRE_3_PAY)) {
                    userScore[loseChair] -= score;
                }
                // 点炮包三家
                if (this.provideUser != winChair && this._hasRule(define_1.RULE.FIRE_PAY_3)) {
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
                if (chair == winChair)
                    return;
                let score = -userScore[chair];
                if (this.m_pTable.sitUser[chair].Score <= score) {
                    score = this.m_pTable.sitUser[chair].Score;
                    // 给房费预留出来
                    if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1) {
                        score -= this.gameRules[1];
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
    getChiHuTimes(chiHuRight) {
        // [条件, 番数]
        let list = [
            // 手把一
            [(chiHuRight & define_1.CHR.BA_1) > 0, 1],
            // 清一色
            [(chiHuRight & define_1.CHR.QING_YI_SE) > 0, 2],
            // 独门
            [(chiHuRight & define_1.CHR.DU_MEN) > 0, 1],
        ];
        let times = 0;
        if (chiHuRight & define_1.CHR.PIAO) {
            times = 3;
        }
        else if (chiHuRight & (define_1.CHR.BAI_JIA | define_1.CHR.CHUN_JIA)) {
            times = 2;
        }
        else {
            times = 1;
        }
        times += this._callTimes(list);
        return times;
    }
    getLoseScore(winChair, loseChair) {
        // [条件, 番数]
        let list = [
            // 杠开
            [this.gangUser == winChair && this.provideUser == winChair, 1],
            // 流泪
            [this._hasRule(define_1.RULE.TEAR) && this.gangUser == this.provideUser && winChair != this.provideUser, 1],
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
        let times = this.getChiHuTimes(this.chiHuRight[winChair]);
        times += this._callTimes(list);
        if (this.chiHuRight[winChair] != define_1.CHR.NULL) {
            if (this.is3BiMen(winChair))
                this.chiHuRight[winChair] |= define_1.CHR.MEN_DA_3;
            if (this.gangUser == winChair && this.provideUser == winChair)
                this.chiHuRight[winChair] |= define_1.CHR.GANG_KAI;
        }
        let score = scoreList[times];
        if (score == null)
            score = 1000;
        return score;
    }
    _callTimes(list) {
        let times = 0;
        for (let i in list) {
            if (list[i][0]) {
                times += list[i][1];
            }
        }
        return times;
    }
    // 是否三家站
    is3BiMen(winChair) {
        if (this._hasRule(define_1.RULE.PLAYER_4)) {
            for (let i = 0; i < this.weaveItem.length; i++) {
                if (i == winChair)
                    continue;
                if (this.gameLogic.isOpen(this.weaveItem[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    splitCard(chair, firstChair) {
        if (this.leftCardCnt < 0) {
            console.warn('dispatchCardData err ' + this.leftCardCnt);
            return false;
        }
        this.sendCardData = this.repertoryCard[--this.leftCardCnt];
        this.cardIndex[chair][this.gameLogic.switchToCardIndex(this.sendCardData)]++;
        this.splitSendCard[chair] = this.sendCardData;
        this._updateCard(chair);
        let next = this.findNext(chair);
        if (next != firstChair) {
            setTimeout(this.splitCard.bind(this, next, firstChair), 1000);
        }
        else {
            this.provideUser = table_1.INVALID_CHAIR;
            this.providerCard = 0;
            for (let i = firstChair, j = 0; i != firstChair || j == 0; i = this.findNext(i), j++) {
                this.cardIndex[i][this.gameLogic.switchToCardIndex(this.splitSendCard[i])]--;
                this.chiHuRight[i] = this.gameLogic.analyseChiHu(this.cardIndex[i], this.weaveItem[i], this.splitSendCard[i]);
                if (define_1.CHR.NULL != this.chiHuRight[i]) {
                    this.provideUser = i;
                    this.providerCard = this.splitSendCard[i];
                    if (!this.allFire)
                        break;
                }
            }
            setTimeout(this.concludeGame.bind(this, table_1.INVALID_CHAIR), 1000);
        }
    }
    dispatchCardData(chair, isAnGang) {
        // 分张
        if (this.leftCardCnt <= LAST_CARD_COUNT) {
            if (this._hasRule(define_1.RULE.SEA_MOON)) {
                setTimeout(this.splitCard.bind(this, chair, chair), 1000);
            }
            else {
                this.concludeGame(table_1.INVALID_CHAIR);
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
        let condition = res[chair] && res[chair].length == 1 && res[chair][0].actionMask == define_1.WIK.LISTEN;
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
    sendUserOutCard(chair) {
        this.currentUser = chair;
        this.outCard = 0;
        this.m_pTable.sendMsgToAll('onUserCanOut', {
            currentUser: chair
        });
        return true;
    }
    sendOperateNotice() {
        let res;
        if (this.outCard == 0) {
            res = this._currentOperateNotice();
        }
        else {
            res = this._otherOperateNotice();
        }
        return this._sendOperate(res);
    }
    _sendOperate(res) {
        let isSend = false;
        this.forUser(i => {
            if (res[i] && res[i].length > 0) {
                this.userOperate[i] = res[i];
                this.m_pTable.sendMsgByChair(i, 'onOperateNotice', res[i]);
                isSend = true;
            }
        });
        return isSend;
    }
    // 暗杠 补杠 听牌 胡牌
    _currentOperateNotice() {
        let res = [];
        let chair = this.currentUser;
        res[chair] = [];
        let results = res[chair];
        // 胡牌
        if (this.providerCard != 0) {
            this.cardIndex[chair][this.gameLogic.switchToCardIndex(this.providerCard)]--;
            if (define_1.CHR.NULL != this.gameLogic.analyseChiHu(this.cardIndex[chair], this.weaveItem[chair], this.providerCard)) {
                results.push({
                    actionMask: define_1.WIK.CHI_HU,
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
                    actionMask: define_1.WIK.LISTEN,
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
                    actionMask: define_1.WIK.GANG,
                    centerCard: cards[0] ? cards[0] : cards[3],
                    cards: cards
                });
            });
        }
        return res;
    }
    // 明杠 吃 碰 胡
    _otherOperateNotice() {
        let res = [];
        this.forUser(chair => {
            if (chair == this.provideUser)
                return;
            res[chair] = [];
            let results = res[chair];
            // 胡牌
            if (define_1.CHR.NULL != this.gameLogic.analyseChiHu(this.cardIndex[chair], this.weaveItem[chair], this.providerCard)) {
                results.push({
                    actionMask: define_1.WIK.CHI_HU,
                    centerCard: this.providerCard,
                    cards: [this.providerCard]
                });
            }
            // 杠牌
            let gangCards = this.gameLogic.analyzeGangCard(this.cardIndex[chair], this.providerCard);
            if (gangCards.length != 0) {
                gangCards.forEach(cards => {
                    results.push({
                        actionMask: define_1.WIK.GANG,
                        centerCard: cards[0] ? cards[0] : cards[3],
                        cards: cards
                    });
                });
            }
            if (!this.listenState[chair]) {
                // 碰牌
                if (this.gameLogic.analysePengCard(this.cardIndex[chair], this.providerCard)) {
                    results.push({
                        actionMask: define_1.WIK.PENG,
                        centerCard: this.providerCard,
                        cards: [this.providerCard, this.providerCard, this.providerCard]
                    });
                }
                // 吃牌
                if (this.canEat && this.findNext(this.provideUser) == chair) {
                    let chiRes = this.gameLogic.analyseEatCard(this.cardIndex[chair], this.providerCard);
                    if (chiRes != define_1.WIK.NULL) {
                        for (let i = 0; i < 3; i++) {
                            let wik = (1 << i); // WIK.LEFT WIK.CENTER WIK.RIGHT
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
    _updateCard(chair, isAction) {
        // let cnt = this.gameLogic.getCardCnt(this.cardIndex[chair]);
        // let sendCard = (cnt - 2) % 3 == 0;
        this._sendBaseCard();
        this._sendHandCard(chair, isAction);
    }
    _sendHandCard(chair, isAction) {
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
        });
    }
    _sendBaseCard() {
        var cardCnt = [];
        this.forUser(chair => {
            cardCnt[chair] = this.gameLogic.getCardCnt(this.cardIndex[chair]);
        });
        this.m_pTable.sendMsgToAll('onBaseCard', {
            cardCnt: cardCnt,
            currentUser: this.currentUser,
            weaveItem: this.weaveItem,
        });
    }
    forUser(call) {
        for (var i in this.playerStatus) {
            if (call(parseInt(i)))
                break;
        }
    }
    findNext(chair) {
        for (var i = 0; i < GAME_PLAYER; i++) {
            var next = (chair + i + 1) % GAME_PLAYER;
            if (!!this.m_pTable.sitUser[next])
                return next;
        }
        return table_1.INVALID_CHAIR;
    }
    _hasRule(rule) {
        return (this.gameRules[0] & rule) > 0;
    }
}
exports.CTableSink = CTableSink;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVTaW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vYXBwL2dhbWUvNTIyMDAvdGFibGVTaW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG9DQUFvRDtBQUNwRCw4REFBMkQ7QUFDM0Qsb0RBQWlEO0FBQ2pELHFDQUFzRDtBQUN0RCwyQ0FBd0M7QUF5RXhDLEtBQUs7QUFDTCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDdEIsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQztBQUMxQixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFHekIsTUFBYSxVQUFVO0lBK0RuQixZQUFvQixRQUFnQjtRQUFoQixhQUFRLEdBQVIsUUFBUSxDQUFRO1FBN0RwQyxNQUFNO1FBQ04sVUFBVTtRQUNGLFlBQU8sR0FBWSxLQUFLLENBQUM7UUFDakMsUUFBUTtRQUNBLGNBQVMsR0FBWSxJQUFJLENBQUM7UUFDbEMsUUFBUTtRQUNBLFdBQU0sR0FBWSxJQUFJLENBQUM7UUFJdkIsY0FBUyxHQUFhLEVBQUUsQ0FBQztRQUV6QixpQkFBWSxHQUFjLEVBQUUsQ0FBQztRQUU3QixnQkFBVyxHQUFXLHFCQUFhLENBQUM7UUFFcEMsZ0JBQVcsR0FBVyxxQkFBYSxDQUFDO1FBRXBDLGlCQUFZLEdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUVsQyxhQUFRLEdBQVcscUJBQWEsQ0FBQyxDQUFDLEtBQUs7UUFDL0MsT0FBTztRQUNDLGtCQUFhLEdBQWEsRUFBRSxDQUFDO1FBQ3JDLFFBQVE7UUFDQSxnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUNoQyxPQUFPO1FBQ0MsY0FBUyxHQUFlLElBQUksS0FBSyxFQUFZLENBQUM7UUFDdEQsY0FBYztRQUNOLGNBQVMsR0FBbUIsSUFBSSxLQUFLLEVBQWdCLENBQUM7UUFD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