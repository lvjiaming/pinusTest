"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTableSink = void 0;
const table_1 = require("../table");
const dbManager_1 = require("./../../repositories/dbManager");
const response_1 = require("./../../util/response");
const define_1 = require("./define");
const gameLogic_1 = require("./gameLogic");
// CMD Client
// 常量
const GAME_PLAYER = 3;
var STATE;
(function (STATE) {
    STATE[STATE["CALL"] = 0] = "CALL";
    STATE[STATE["DOUBLE"] = 1] = "DOUBLE";
    STATE[STATE["SHOW"] = 2] = "SHOW";
    STATE[STATE["OUT"] = 3] = "OUT"; // 出牌
})(STATE || (STATE = {}));
var OPSTATE;
(function (OPSTATE) {
    OPSTATE[OPSTATE["NO_CALL"] = 0] = "NO_CALL";
    OPSTATE[OPSTATE["CALL_1"] = 1] = "CALL_1";
    OPSTATE[OPSTATE["CALL_2"] = 2] = "CALL_2";
    OPSTATE[OPSTATE["CALL_3"] = 3] = "CALL_3";
    OPSTATE[OPSTATE["NO_DOUBLE"] = 4] = "NO_DOUBLE";
    OPSTATE[OPSTATE["DOUBLE"] = 5] = "DOUBLE";
    OPSTATE[OPSTATE["NO_OUT"] = 6] = "NO_OUT";
    OPSTATE[OPSTATE["SHOW"] = 7] = "SHOW";
})(OPSTATE || (OPSTATE = {}));
class CTableSink {
    constructor(m_pTable) {
        this.m_pTable = m_pTable;
        this.gameRules = [];
        this.playerStatus = [];
        this.state = STATE.CALL;
        this.firstUser = table_1.INVALID_CHAIR;
        this.currentUser = table_1.INVALID_CHAIR;
        this.bankUser = table_1.INVALID_CHAIR;
        // 当前牌库
        this.repertoryCard = [];
        // 三张暗牌
        this.backCard = [];
        // 手牌
        this.handCard = [];
        // 当轮牌
        this.currentCard = [];
        // 当轮最大玩家
        this.maxUser = table_1.INVALID_CHAIR;
        // 加倍 -1 未操作 0 不加倍 1加倍
        this.isDouble = [];
        // 叫分 -1 未操作 0 不叫 1 一分 2 两分 3 三分
        this.callScore = [];
        // 是否明牌
        this.isShowCard = [];
        // 低分
        this.cellScore = 0;
        // 出牌数量
        this.outCardTimes = [];
        // 翻倍
        this.times = 0;
        this.maxScore = 0;
        this.isEnd = false;
        // 大结算数据
        this.winCnt = [];
        this.bombCnt = [];
        this.bankCnt = [];
        this.totalScore = [];
        this.gameLogic = new gameLogic_1.GameLogic();
    }
    _initRoom() {
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
        this.bankUser = table_1.INVALID_CHAIR;
        this.maxUser = table_1.INVALID_CHAIR;
        this.times = 0;
        this.m_pTable.clearTimer('autoStart');
    }
    setRules(gameRules, serverRules) {
        this.gameRules = gameRules;
        this.gameLogic.setRules(gameRules);
        if (this._hasRule(define_1.RULE.MAX_48)) {
            this.maxScore = 48;
        }
        else if (this._hasRule(define_1.RULE.MAX_96)) {
            this.maxScore = 96;
        }
        else {
            this.maxScore = 192;
        }
        for (let i = 0; i < GAME_PLAYER; i++) {
            this.winCnt[i] = 0;
            this.bombCnt[i] = 0;
            this.bankCnt[i] = 0;
            this.totalScore[i] = 0;
        }
    }
    getMaxChair() {
        return GAME_PLAYER;
    }
    getUserCnt() {
        return GAME_PLAYER;
    }
    getMaxInning() {
        if (this._hasRule(define_1.RULE.INNING_20))
            return 20;
        else
            return 10;
    }
    onEnterUser(chair, user) {
        if (this.firstUser == table_1.INVALID_CHAIR) {
            this.firstUser = chair;
        }
        if (this._hasRule(define_1.RULE.SCORE_100)) {
            user.Score = 100;
        }
        else if (this._hasRule(define_1.RULE.SCORE_200)) {
            user.Score = 200;
        }
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
        if (this.firstUser == chair) {
            this.firstUser = this.findNext(chair);
        }
    }
    onScene(chairID) {
        let state = this.m_pTable.gameState;
        switch (state) {
            case table_1.GameState.SCENE_FREE: {
                let obj = {};
                return this.m_pTable.sendMsgByChair(chairID, 'onSceneFree', obj);
            }
            case table_1.GameState.SCENE_PLAYING: {
                let obj = {};
                this.updateHandCard(chairID);
                if (chairID == this.currentUser) {
                    this._operateNotify(chairID);
                }
                else {
                    this.m_pTable.sendMsgByChair(chairID, 'onCurrentUser', {
                        chair: this.currentUser
                    });
                }
                if (this.bankUser != table_1.INVALID_CHAIR) {
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
    onFrameStart() {
        // 初始化游戏数据
        this._initRoom();
        this.m_pTable.gameState = table_1.GameState.SCENE_PLAYING;
        if (this.firstUser == table_1.INVALID_CHAIR) {
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
        let obj = {
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
    _updateHandCnt() {
        let cnt = [];
        this.forUser(i => {
            cnt[i] = this.handCard[i].length;
        });
        this.m_pTable.sendMsgToAll('onUpdateHandCnt', cnt);
    }
    _updateUserCard(chair) {
        if (this.isShowCard[chair]) {
            this.m_pTable.sendMsgToAll('onUpdateCard', { chair: chair, cards: this.handCard[chair] });
        }
        else {
            this.m_pTable.sendMsgByChair(chair, 'onUpdateCard', { chair: chair, cards: this.handCard[chair] });
        }
    }
    updateHandCard(chair) {
        this._updateHandCnt();
        this._updateUserCard(chair);
    }
    _operateNotify(chair) {
        this.currentUser = chair;
        switch (this.state) {
            case STATE.CALL: {
                let obj = {
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
                this.m_pTable.sendMsgByChair(chair, 'onOpOut', this.maxUser == table_1.INVALID_CHAIR ? [] : this.currentCard[this.maxUser]);
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
    onEventTimer(key, param) {
        if (key == 'autoStart') {
            this.m_pTable.startGame();
        }
        return true;
    }
    sendBigEnd() {
        this.m_pTable.sendMsgToAll('onBigEnd', {
            score: this.totalScore,
            winCnt: this.winCnt,
            bombCnt: this.bombCnt,
            bankCnt: this.bankCnt
        });
    }
    concludeGame(chair, isDiss) {
        let next = this.findNext(this.bankUser);
        let spring = chair == this.bankUser && this.outCardTimes[next] == 0 && this.outCardTimes[this.findNext(next)] == 0;
        let anSpring = chair != this.bankUser && this.outCardTimes[this.bankUser] == 1;
        let score = this.calScore(chair, spring || anSpring);
        let revenue = [];
        // this.forUser(user => {
        //     if (this.m_pTable.roomInfo.ClubKey) {
        //         revenue[user] = (this.m_pTable.roomInfo.Process == 1 && !isDiss) ? this.gameRules[1] : 0;
        //     }
        // });
        let springIdx = 0;
        if (spring) {
            springIdx = 2;
        }
        else if (anSpring) {
            springIdx = 1;
        }
        else {
            springIdx = 0;
        }
        this.m_pTable.sendMsgToAll('onGameConclude', {
            score: score,
            cards: this.handCard,
            spring: isDiss ? 0 : springIdx,
            bankUser: this.bankUser
        });
        if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1 && !isDiss) {
            this.forUser(i => {
                score[i] -= this.gameRules[1];
            });
        }
        this.m_pTable.writeScore(score, null);
        this.m_pTable.concludeGame(this.isEnd || isDiss);
        if (!this.isEnd && !isDiss) {
            this.m_pTable.setTimer('autoStart', 12000);
        }
        return true;
    }
    calScore(chair, spring) {
        let userScore = [];
        if (chair == table_1.INVALID_CHAIR) {
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
            if (i == this.bankUser)
                return;
            let score = baseScore;
            // 自己加倍x2
            score *= this.isDouble[i] == 1 ? 2 : 1;
            // 庄家加倍自己加倍x2
            score *= (this.isDouble[this.bankUser] == 1 && this.isDouble[i] == 1) ? 2 : 1;
            if (Math.abs(score) > this.maxScore)
                score = chair == this.bankUser ? -this.maxScore : this.maxScore;
            if (userScore[i] == null)
                userScore[i] = 0;
            if (userScore[this.bankUser] == null)
                userScore[this.bankUser] = 0;
            userScore[i] += score;
            userScore[this.bankUser] -= score;
        });
        if (this.m_pTable.roomInfo.ClubKey) {
            // 庄家输了钱不够
            if (userScore[this.bankUser] < 0 &&
                this.bankUser != chair &&
                this.m_pTable.sitUser[this.bankUser].Score < -userScore[this.bankUser]) {
                let newScore = [], bankScore = this.m_pTable.sitUser[this.bankUser].Score;
                // 给房费预留出来
                if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1) {
                    bankScore -= this.gameRules[1];
                }
                this.forUser(i => {
                    if (i == this.bankUser)
                        return;
                    newScore[i] = Math.floor(bankScore * userScore[i] / (-userScore[this.bankUser]));
                });
                newScore[this.bankUser] = -bankScore;
                userScore = newScore;
                this.isEnd = true;
                // 如果地主赢了
            }
            else if (this.bankUser == chair) {
                userScore[this.bankUser] = 0;
                this.forUser(i => {
                    if (i == this.bankUser)
                        return;
                    let score = this.m_pTable.sitUser[i].Score;
                    // 给房费预留出来
                    if (this.m_pTable.roomInfo.ClubKey && this.m_pTable.roomInfo.Process == 1) {
                        score -= this.gameRules[1];
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
            if (userScore[i] > 0)
                this.winCnt[i]++;
            this.totalScore[i] += userScore[i];
        }
        return userScore;
    }
    forUser(call) {
        for (let i in this.playerStatus) {
            if (call(parseInt(i)))
                break;
        }
    }
    findNext(chair) {
        for (let i = 0; i < GAME_PLAYER; i++) {
            let next = (chair + i + 1) % GAME_PLAYER;
            if (!!this.m_pTable.sitUser[next])
                return next;
        }
        return table_1.INVALID_CHAIR;
    }
    _hasRule(rule) {
        return (this.gameRules[0] & rule) > 0;
    }
    _notifyTimes() {
        if (this.bankUser == table_1.INVALID_CHAIR) {
            this.m_pTable.sendMsgToAll('onUpdateTimes', { times: 1 });
        }
        else {
            let bankTimes = 0;
            this.forUser(i => {
                if (i == this.bankUser)
                    return;
                let times = this.times + (this.isDouble[i] == 1 ? 1 : 0) +
                    (this.isShowCard[i] ? 1 : 0) +
                    (this.isDouble[this.bankUser] == 1 && this.isDouble[i] == 1 ? 1 : 0);
                times = Math.pow(2, times);
                this.m_pTable.sendMsgByChair(i, 'onUpdateTimes', { times: times });
                bankTimes += times;
            });
            this.m_pTable.sendMsgByChair(this.bankUser, 'onUpdateTimes', { times: bankTimes });
        }
    }
    // 客户端->服务端
    onCallScore(chair, score) {
        if (this.currentUser != chair)
            return false;
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
                chair: table_1.INVALID_CHAIR
            });
            this.onFrameStart();
            return true;
        }
        // 有人叫3分, 或者轮完一圈有人叫
        if (this.cellScore != 0 && this.bankUser != table_1.INVALID_CHAIR &&
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
            if (this._hasRule(define_1.RULE.NO_KICK)) {
                this._showOrOut();
            }
            else {
                this.state = STATE.DOUBLE;
                this._operateNotify(this.findNext(this.bankUser));
            }
            return true;
        }
        else {
            this._operateNotify(this.findNext(chair));
            return true;
        }
    }
    _showOrOut() {
        if (this._hasRule(define_1.RULE.SHOW_CARD)) {
            this.state = STATE.SHOW;
        }
        else {
            this.state = STATE.OUT;
        }
        this._operateNotify(this.bankUser);
    }
    _isFarmerUnKick() {
        let isUnKick = true;
        this.forUser(i => {
            if (i == this.bankUser)
                return;
            if (this.isDouble[i])
                isUnKick = false;
        });
        return isUnKick;
    }
    onKick(chair, isKick) {
        if (this.currentUser != chair)
            return true;
        this.isDouble[chair] = isKick ? 1 : 0;
        this.m_pTable.sendMsgToAll('onOpRes', {
            chair: chair,
            state: isKick ? OPSTATE.DOUBLE : OPSTATE.NO_DOUBLE
        });
        this._notifyTimes();
        if (chair == this.bankUser || (this.findNext(chair) == this.bankUser) &&
            (this._isFarmerUnKick() || this._hasRule(define_1.RULE.FARMER_KICK))) {
            if (this.isDouble[this.bankUser] == -1)
                this.isDouble[this.bankUser] = 0;
            this._showOrOut();
        }
        else {
            this._operateNotify(this.findNext(chair));
        }
        return true;
    }
    onShowCard(chair, isShow) {
        if (this.bankUser != chair)
            return true;
        if (this.currentUser != chair)
            return true;
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
        return true;
    }
    onOutCard(chair, cards) {
        if (this.currentUser != chair)
            return true;
        // 没有当轮最大玩家, 然后还不出
        if (cards.length == 0 && this.maxUser == table_1.INVALID_CHAIR) {
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
            if (type == define_1.TYPE.MISSILE || type == define_1.TYPE.BOMB) {
                this.times++;
                this.bombCnt[chair]++;
            }
            this._notifyTimes();
            this.gameLogic.removeCards(this.handCard[chair], cards);
            this.updateHandCard(chair);
        }
        else {
            this.m_pTable.sendMsgToAll('onOpRes', {
                chair: chair,
                state: OPSTATE.NO_OUT
            });
        }
        this.m_pTable.sendMsgToAll('onOutCard', {
            chair: chair,
            cards: cards,
            first: true,
            isMax: this.maxUser == table_1.INVALID_CHAIR || this.currentCard[this.maxUser].length != cards.length
        });
        this.currentCard[chair] = cards;
        let next = this.findNext(chair);
        // 不出
        if (cards.length == 0) {
            // 如果下一个玩家是最大玩家结束当轮, 最大玩家出牌, 不是则下一玩家出牌
            if (next == this.maxUser) {
                this.forUser(i => {
                    if (i == chair)
                        return false;
                    this.m_pTable.sendMsgToAll('onOutCard', { chair: i, cards: [], first: false });
                    this.currentCard[i] = [];
                });
                this._operateNotify(this.maxUser);
                this.maxUser = table_1.INVALID_CHAIR;
            }
            else {
                this._operateNotify(next);
            }
        }
        else {
            if (this.handCard[chair].length == 0) {
                this.firstUser = chair;
                this.m_pTable.sendMsgToAll('onCurrentUser', {
                    chair: table_1.INVALID_CHAIR
                });
                return this.concludeGame(chair);
            }
            this.currentCard[chair] = cards;
            this.maxUser = chair;
            this._operateNotify(this.findNext(chair));
        }
        return true;
    }
    _checkOutCard(cards) {
        if (cards.length == 0)
            return true;
        let type = this.gameLogic.getCardType(cards);
        if (type == define_1.TYPE.ERROR)
            return false;
        if (this.maxUser == table_1.INVALID_CHAIR)
            return true;
        else {
            return this.gameLogic.compareCard(cards, this.currentCard[this.maxUser]);
        }
    }
}
exports.CTableSink = CTableSink;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVTaW5rLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vYXBwL2dhbWUvNDAxMDcvdGFibGVTaW5rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG9DQUFvRDtBQUNwRCw4REFBMkQ7QUFDM0Qsb0RBQWlEO0FBQ2pELHFDQUFzQztBQUN0QywyQ0FBd0M7QUFVeEMsYUFBYTtBQUViLEtBQUs7QUFDTCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFFdEIsSUFBSyxLQUtKO0FBTEQsV0FBSyxLQUFLO0lBQ04saUNBQVEsQ0FBQTtJQUNSLHFDQUFNLENBQUE7SUFDTixpQ0FBSSxDQUFBO0lBQ0osK0JBQUcsQ0FBQSxDQUFTLEtBQUs7QUFDckIsQ0FBQyxFQUxJLEtBQUssS0FBTCxLQUFLLFFBS1Q7QUFFRCxJQUFLLE9BU0o7QUFURCxXQUFLLE9BQU87SUFDUiwyQ0FBVyxDQUFBO0lBQ1gseUNBQU0sQ0FBQTtJQUNOLHlDQUFNLENBQUE7SUFDTix5Q0FBTSxDQUFBO0lBQ04sK0NBQVMsQ0FBQTtJQUNULHlDQUFNLENBQUE7SUFDTix5Q0FBTSxDQUFBO0lBQ04scUNBQUksQ0FBQTtBQUNSLENBQUMsRUFUSSxPQUFPLEtBQVAsT0FBTyxRQVNYO0FBR0QsTUFBYSxVQUFVO0lBa0RuQixZQUFvQixRQUFnQjtRQUFoQixhQUFRLEdBQVIsUUFBUSxDQUFRO1FBOUM1QixjQUFTLEdBQWEsRUFBRSxDQUFDO1FBRXpCLGlCQUFZLEdBQWMsRUFBRSxDQUFDO1FBRTdCLFVBQUssR0FBVSxLQUFLLENBQUMsSUFBSSxDQUFDO1FBRTFCLGNBQVMsR0FBVyxxQkFBYSxDQUFDO1FBRWxDLGdCQUFXLEdBQVcscUJBQWEsQ0FBQztRQUVwQyxhQUFRLEdBQVcscUJBQWEsQ0FBQztRQUN6QyxPQUFPO1FBQ0Msa0JBQWEsR0FBYSxFQUFFLENBQUM7UUFDckMsT0FBTztRQUNDLGFBQVEsR0FBYSxFQUFFLENBQUM7UUFDaEMsS0FBSztRQUNH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