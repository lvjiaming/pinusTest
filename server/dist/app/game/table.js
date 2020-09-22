"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTable = exports.INVALID_CHAIR = exports.StartModel = exports.GameState = void 0;
const config_1 = require("../../config/config");
const dispatcher_1 = require("../util/dispatcher");
const dbManager_1 = require("./../repositories/dbManager");
const hallService_1 = require("./../servers/hall/service/hallService");
const response_1 = require("./../util/response");
const WeChatH5_1 = require("../WeChatH5/WeChatH5");
var UserState;
(function (UserState) {
    UserState[UserState["FREE"] = 0] = "FREE";
    UserState[UserState["PALYING"] = 1] = "PALYING";
    UserState[UserState["LOOK"] = 2] = "LOOK";
})(UserState || (UserState = {}));
var GameState;
(function (GameState) {
    GameState[GameState["SCENE_FREE"] = 0] = "SCENE_FREE";
    GameState[GameState["SCENE_PLAYING"] = 1] = "SCENE_PLAYING";
})(GameState = exports.GameState || (exports.GameState = {}));
var StartModel;
(function (StartModel) {
    StartModel[StartModel["ALL_READY"] = 0] = "ALL_READY";
    StartModel[StartModel["FULL_READY"] = 1] = "FULL_READY";
})(StartModel = exports.StartModel || (exports.StartModel = {}));
exports.INVALID_CHAIR = -1;
class CTable {
    constructor(app, channel, KindID) {
        this.app = app;
        this.m_pTableSink = null;
        this.roomInfo = null;
        this.channel = null;
        this.sitUser = [];
        this.lookonUser = [];
        this.users = {}; //userid => sid
        this.chairCnt = 0;
        this.gameState = 0;
        this.startModel = StartModel.ALL_READY;
        this.dissTime = 60;
        this.startTime = null;
        this.writeSaveScore = [];
        this.writeSaveRevenue = [];
        this.dissRoomData = null;
        this.timer = {};
        this.recordData = null;
        this.isRecord = true;
        this.channel = channel;
        let tableSink = require(`./${KindID}/tableSink`);
        if (tableSink && tableSink.CTableSink) {
            tableSink = tableSink.CTableSink;
            this.m_pTableSink = new tableSink(this);
        }
    }
    async setRoomInfo(RoomID) {
        let res = await dbManager_1.DBManager.get().gameDB.getRoomInfo(RoomID);
        res.GameRules = JSON.parse(res.GameRules);
        this.roomInfo = res;
        this.m_pTableSink.setRules(this.roomInfo.GameRules, this.roomInfo.ServerRules);
        this.chairCnt = this.m_pTableSink.getUserCnt();
        let config = await dbManager_1.DBManager.get().systemDB.getConfig('DissolveTime');
        if (config) {
            this.dissTime = parseInt(config.ConfigValue);
        }
    }
    async enterRoom(userID, session, gps) {
        let sid = session.get('FrontendID');
        let member = this.channel.getMember(userID + '');
        if (!member) {
            this.channel.add(userID + '', sid);
            this.users[userID] = sid;
        }
        //旁观预留
        let chair;
        let user = this.getSitUser(userID);
        if (!user) {
            chair = this._getNullChair();
            if (chair == exports.INVALID_CHAIR) {
                this.sendMsgByUserID(userID, 'onErrMsg', response_1.Response.ERROR('房间已经没有空座了'));
                this.leave(userID);
                return false;
            }
            if (!await this.m_pTableSink.onCheckEnter(userID)) {
                this.leave(userID);
                return false;
            }
            if (this.m_pTableSink.getMaxChair() == 4 && this.getSitCnt() == 1 && !this.sitUser[2]) {
                chair = 2;
            }
            let userInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(userID);
            userInfo.NickName = encodeURI(userInfo.NickName);
            user = {
                UserInfo: userInfo,
                ChairID: chair,
                State: UserState.FREE,
                Ready: false,
                Offline: false,
                Score: await dbManager_1.DBManager.get().gameDB.getWriteScore(this.roomInfo.ID, userInfo.UserID),
                sid: sid,
                GPSInfo: gps
            };
            this.m_pTableSink.onEnterUser(chair, user);
        }
        else {
            chair = user.ChairID;
            user.Offline = false;
        }
        this.sendMsgByUserID(userID, 'onRoomInfo', this.roomInfo);
        this.sendMsgToAll('onEnterUser', [user]);
        this.sendMsgByUserID(userID, 'onEnterUser', this.sitUser);
        this.sitUser[chair] = user;
        this._notifyClub();
        this.isRecord = false;
        let res = this.m_pTableSink.onScene(chair);
        this.isRecord = true;
        if (!res) {
            this.leave(userID);
            return res;
        }
        if (this.writeSaveScore[chair] == null)
            this.writeSaveScore[chair] = 0;
        if (this.writeSaveRevenue[chair] == null)
            this.writeSaveRevenue[chair] = 0;
        if (this.dissRoomData)
            this.sendMsgByUserID(userID, 'onDissRoomApply', this._getDissData());
        return true;
    }
    updateGPS(userID, data) {
        let user = this.getSitUser(userID);
        user.GPSInfo = data;
        this.sendMsgToAll('onEnterUser', [user]);
    }
    async concludeGame(isDiss) {
        await this._writeScore();
        this.sitUser.forEach(user => {
            user.Ready = false;
            user.State = UserState.FREE;
        });
        this.sendMsgToAll('onEnterUser', this.sitUser);
        this.gameState = GameState.SCENE_FREE;
        // 解散或者局数到达最大局数
        let maxInning = this.m_pTableSink.getMaxInning();
        // 如果 maxInning = 0 无限局数
        if (isDiss || maxInning <= this.roomInfo.Process && maxInning != 0) {
            this.clearTimer('*');
            this.m_pTableSink.sendBigEnd();
            this.gameConclude();
        }
    }
    writeScore(score, revenue) {
        for (let i in this.sitUser) {
            this.writeUserScore(parseInt(i), score[i], revenue ? revenue[i] : 0);
        }
    }
    writeUserScore(chair, score, revenue) {
        if (!this.sitUser[chair]) {
            console.warn("writeScore err " + chair);
            return;
        }
        this.writeSaveScore[chair] += score;
        this.sitUser[chair].Score += score;
        this.writeSaveRevenue[chair] += revenue;
        // this.sitUser[chair].Score -= revenue;
        this.sendMsgToAll('onEnterUser', [this.sitUser[chair]]);
    }
    leave(userID) {
        for (var i in this.sitUser) {
            if (this.sitUser[i].UserInfo.UserID === userID) {
                this.m_pTableSink.onLeaveUser(this.sitUser[i].ChairID);
                delete this.sitUser[i];
                this._notifyClub();
                break;
            }
        }
        for (var i in this.lookonUser) {
            if (this.lookonUser[i].UserInfo.UserID === userID) {
                delete this.lookonUser[i];
                break;
            }
        }
        dbManager_1.DBManager.get().gameDB.delRoomLocker(userID);
    }
    // 房主外部解散
    async clearRoom() {
        if (this.roomInfo.Process == 0) {
            if (this.roomInfo.ServerRules & config_1.SERVER_RULE.CREATE_ROOMCARD) {
                let needCard = config_1.getSpend(this.roomInfo.KindID, this.roomInfo.GameRules, this.roomInfo.ServerRules);
                if (this.roomInfo.ServerRules & config_1.SERVER_RULE.PAY_CREATOR) {
                    await dbManager_1.DBManager.get().accountDB.addRoomCardAndRecord(this.roomInfo.CreatorID, needCard);
                    this.app.rpc.hall.hallRemote.updateUserInfo.toServer(dispatcher_1.dispatch(this.roomInfo.CreatorID + '', this.app.getServersByType('hall')).id, this.roomInfo.CreatorID);
                }
                else {
                    for (let user of this.sitUser) {
                        if (!user)
                            continue;
                        await dbManager_1.DBManager.get().accountDB.addRoomCardAndRecord(user.UserInfo.UserID, needCard);
                    }
                }
            }
        }
        await dbManager_1.DBManager.get().gameDB.delRoomLockerByRoomID(this.roomInfo.RoomID);
        await dbManager_1.DBManager.get().gameDB.delRoomInfo(this.roomInfo.RoomID);
        if (this.roomInfo.ClubKey) {
            await this.app.rpc.club.clubRemote.updateRoom.toServer(dispatcher_1.dispatch(this.roomInfo.ClubKey + '', this.app.getServersByType('club')).id, this.roomInfo.ClubKey);
        }
        this.channel.destroy();
    }
    startGame() {
        this._updateProcess(this.roomInfo.Process + 1);
        this.startTime = new Date();
        this.sitUser.forEach(user => {
            user.Ready = false;
            user.State = UserState.PALYING;
        });
        this.sendMsgToAll('onEnterUser', this.sitUser);
        this.startRecord();
        let res = this.m_pTableSink.onFrameStart();
        if (!res) {
            console.log('onFrameStart return false');
        }
    }
    onGameMsg(userID, route, data) {
        let user = this.getSitUser(userID);
        if (!user) {
            console.log('没有找到玩家 userid:' + userID);
            return;
        }
        let tableSink = this.m_pTableSink;
        if (tableSink[route]) {
            let res = tableSink[route](user.ChairID, data);
            if (!res) {
                console.log('route return false ' + route);
            }
        }
        else {
            console.log('TabelSink 没有 ' + route + ' 接口');
        }
    }
    userOffline(userID) {
        var user = this.getSitUser(userID);
        if (this.users[userID]) {
            this.channel.leave(userID + '', this.users[userID]);
            delete this.users[userID];
        }
        if (user) {
            user.Offline = true;
            this.sendMsgToAll('onEnterUser', [user]);
            return;
        }
        this.leave(userID);
    }
    hasEmptyChair() {
        return this._getNullChair() != exports.INVALID_CHAIR;
    }
    sendMsgByUserID(userID, route, res) {
        this.app.get('channelService').pushMessageByUids(route, res, [{
                uid: userID + '',
                sid: this.users[userID]
            }]);
        return true;
    }
    sendMsgByChair(chair, route, res, sendLookon) {
        let user = this.sitUser[chair];
        if (user && user.ChairID == chair) {
            this.sendMsgByUserID(user.UserInfo.UserID, route, res);
            this.pushRecord(chair, route, res);
        }
        else {
            console.log('没有找到座位上得玩家! ChairID:' + chair);
            return false;
        }
        if (sendLookon) {
            this.lookonUser.forEach(user => {
                if (user.ChairID == chair) {
                    this.sendMsgByUserID(user.UserInfo.UserID, route, res);
                }
            });
        }
        return true;
    }
    sendMsgToAll(route, res) {
        if (JSON.stringify(this.users) == '{}')
            return false;
        this.channel.pushMessage(route, res);
        this.pushRecord(exports.INVALID_CHAIR, route, res);
        return true;
    }
    setTimer(key, interval, params) {
        if (key == '*') {
            console.log('setTimer Timer Key must not *');
            return;
        }
        let id = setTimeout(this.onEventTimer.bind(this, key), interval);
        let timer = {
            timer: id,
            endTime: Date.now() + interval,
            params: params,
            left: 0
        };
        this.timer[key] = timer;
    }
    clearTimer(key) {
        if (key == '*') {
            for (let i in this.timer) {
                clearTimeout(this.timer[i].timer);
                this.timer = {};
            }
        }
        else {
            let time = this.timer[key];
            if (time) {
                clearTimeout(time.timer);
                delete this.timer[key];
            }
        }
    }
    stopTimer(key) {
        let fn = (time) => {
            if (!time)
                return;
            let now = Date.now();
            clearTimeout(time.timer);
            time.left = time.endTime - now;
        };
        if (key == '*') {
            for (let i in this.timer) {
                fn(this.timer[i]);
            }
        }
        else {
            fn(this.timer[key]);
        }
    }
    resumeTimer(key) {
        let fn = (time, key) => {
            if (!time)
                return;
            if (time.left == 0)
                return;
            time.timer = setTimeout(this.onEventTimer.bind(this, key), time.left);
            time.left = 0;
            time.endTime = Date.now() + time.left;
        };
        if (key === '*') {
            for (let i in this.timer) {
                fn(this.timer[i], i);
            }
        }
        else {
            fn(this.timer[key], key);
        }
    }
    getTimer(key) {
        if (key == '*') {
            console.log('getTimer Timer Key must not *');
            return 0;
        }
        let time = this.timer[key];
        if (!time) {
            console.log('getTimer can not find Timer ' + key);
            return 0;
        }
        return time.endTime;
    }
    // sign 0快捷短语 1表情 2自定义短语 3语音 4魔法表情  5微信语音
    async onChat(userID, data) {
        const user = this.getSitUser(userID);
        data.chairID = user.ChairID;
        if (data.sign == 5) {
            data.msg = await WeChatH5_1.WeChatH5.instance.getWeChatVoice(data.msg);
            data.sign = 3;
        }
        this.sendMsgToAll('onChat', data);
    }
    async userReady(userID) {
        var user = this.getSitUser(userID);
        if (user) {
            user.Ready = true;
        }
        this.sendMsgToAll('onEnterUser', [user]);
        if (this.checkStart()) {
            // for (let user of this.sitUser) {
            //     if (!user) continue;
            //     user.Ready = false;
            //     user.State = UserState.PALYING;
            // }
            this.sitUser.forEach(user => {
                // if (!user) return;
                user.Ready = false;
                user.State = UserState.PALYING;
            });
            this.sendMsgToAll('onEnterUser', this.sitUser);
            this.startGame();
        }
    }
    userLeave(userID) {
        this.sendMsgToAll('onLeaveUser', userID);
        this.leave(userID);
    }
    dissRoom(userID) {
        if (this.roomInfo.Process == 0) {
            if (userID == this.roomInfo.CreatorID) {
                this.sendMsgToAll('onErrMsg', response_1.Response.ERROR('房间已经解散!'));
                this.gameConclude();
            }
            else {
                this.sendMsgByUserID(userID, 'onErrMsg', response_1.Response.OK('您不是房主无法解散房间!'));
            }
        }
        else {
            if (this.dissRoomData != null) {
                console.warn('dissRoom err');
                return;
            }
            let user = this.getSitUser(userID);
            this.dissRoomData = {
                applyUser: userID,
                state: [],
                timer: setTimeout(this._doDissRoom.bind(this, true), this.dissTime * 1000),
                endTime: Date.now() + this.dissTime * 1000,
            };
            this.dissRoomData.state[user.ChairID] = true;
            this.sendMsgToAll('onDissRoomApply', this._getDissData());
        }
    }
    updateDissRoom(userID, state) {
        if (this.dissRoomData == null) {
            console.warn('updateDissRoom err');
            return;
        }
        let user = this.getSitUser(userID);
        this.dissRoomData.state[user.ChairID] = state;
        this.sendMsgToAll('onDissRoom', this._getDissData());
        if (!state) {
            this._doDissRoom(false, user.UserInfo.NickName);
            return;
        }
        let cnt = 0, wait = 0;
        for (let i in this.sitUser) {
            if (!this.sitUser[i])
                continue;
            if (!this.dissRoomData.state[i])
                wait++;
            cnt++;
        }
        let left = (cnt != 2 && config_1.LEFTONE) ? 1 : 0;
        if (wait == left) {
            this._doDissRoom(true);
        }
    }
    async _notifyClub() {
        if (this.roomInfo.ClubKey != 0) {
            await this.app.rpc.club.clubRemote.updateRoomInfo.toServer(dispatcher_1.dispatch(this.roomInfo.ClubKey + '', this.app.getServersByType('club')).id, this.roomInfo.ClubKey, this.roomInfo, this.sitUser);
        }
    }
    async _writeScore() {
        let userCnt = 0;
        this.sitUser.forEach(user => {
            if (user.State == UserState.PALYING)
                userCnt++;
        });
        let totalRevenue = 0;
        this.writeSaveRevenue.forEach(rev => totalRevenue += rev);
        let ret = await dbManager_1.DBManager.get().gameDB.writeDrawInfo(this.roomInfo.KindID, this.roomInfo.ID, this.roomInfo.RoomID, userCnt, totalRevenue, JSON.stringify(this.roomInfo.GameRules), this.roomInfo.ServerRules, this.startTime, new Date(), this.roomInfo.ClubKey);
        let drawID = ret.insertId;
        for (let i in this.sitUser) {
            let user = this.sitUser[i];
            if (user.State != UserState.PALYING)
                continue;
            await dbManager_1.DBManager.get().gameDB.writeDrawScore(drawID, user.UserInfo.UserID, this.roomInfo.ID, user.ChairID, this.writeSaveScore[i], this.writeSaveRevenue[i]);
            if (this.roomInfo.ClubKey) {
                await dbManager_1.DBManager.get().clubDB.writeScore(this.roomInfo.ClubKey, user.UserInfo.UserID, this.writeSaveScore[i], this.writeSaveRevenue[i]);
            }
            this.writeSaveScore[i] = 0;
            this.writeSaveRevenue[i] = 0;
        }
        await this.saveRecord(drawID);
    }
    // 游戏内解散
    async gameConclude() {
        if (this.roomInfo.ClubKey != 0) {
            await hallService_1.HallService.createRoom({
                UserID: this.roomInfo.CreatorID,
                ClubKey: this.roomInfo.ClubKey,
                KindID: this.roomInfo.KindID,
                ServerRules: this.roomInfo.ServerRules,
                GameRules: this.roomInfo.GameRules
            }, this.app);
        }
        await this.clearRoom();
    }
    checkStart() {
        var cnt = 0;
        this.sitUser.forEach(user => {
            if (user.Ready) {
                cnt++;
            }
        });
        switch (this.startModel) {
            case StartModel.FULL_READY: {
                return cnt == this.sitUser.length;
            }
            case StartModel.ALL_READY: {
                return cnt == this.chairCnt;
            }
            default: {
                console.log('没有此开始模式! model:' + this.startModel);
                return false;
            }
        }
    }
    async _updateProcess(process) {
        await dbManager_1.DBManager.get().gameDB.updateProcess(this.roomInfo.RoomID, process);
        this.roomInfo.Process = process;
        this.sendMsgToAll('onUpdateProcess', process);
        this._notifyClub();
    }
    // onFrameMsg
    ////////////////////////////////////////////////////////////////
    _getNullChair() {
        if (this.getSitCnt() == this.m_pTableSink.getUserCnt())
            return exports.INVALID_CHAIR;
        for (var i = 0; i < this.chairCnt; i++) {
            if (this.sitUser[i])
                continue;
            return i;
        }
        return exports.INVALID_CHAIR;
    }
    getSitUser(userID) {
        for (var i in this.sitUser) {
            if (this.sitUser[i].UserInfo.UserID === userID) {
                return this.sitUser[i];
            }
        }
        return null;
    }
    getLookonUser(userID) {
        for (var i in this.lookonUser) {
            if (this.lookonUser[i].UserInfo.UserID === userID) {
                return this.lookonUser[i];
            }
        }
        return null;
    }
    getSitCnt() {
        let cnt = 0;
        for (let user of this.sitUser) {
            if (user)
                cnt++;
        }
        return cnt;
    }
    onEventTimer(key) {
        let time = this.timer[key];
        if (!time) {
            console.log('onEventTimer 没有清掉定时器 ' + key);
            return;
        }
        let res = this.m_pTableSink.onEventTimer(key, time.params);
        if (!res) {
            console.log('onEventTimer return false');
        }
        this.clearTimer(key);
    }
    _doDissRoom(isDiss, username) {
        clearTimeout(this.dissRoomData.timer);
        this.dissRoomData = null;
        if (isDiss) {
            this.sendMsgToAll('onDissRoomRes', response_1.Response.ERROR('所有玩家同意解散房间, 房间解散!'));
            this.m_pTableSink.concludeGame(exports.INVALID_CHAIR, true);
        }
        else {
            this.sendMsgToAll('onDissRoomRes', response_1.Response.OK(`玩家【${username}】拒绝了解散房间`));
        }
    }
    _getDissData() {
        return {
            applyUser: this.dissRoomData.applyUser,
            state: this.dissRoomData.state,
            endTime: this.dissRoomData.endTime
        };
    }
    startRecord() {
        this.recordData = {
            roomInfo: JSON.parse(JSON.stringify(this.roomInfo)),
            sitUser: JSON.parse(JSON.stringify(this.sitUser)),
            gameData: []
        };
    }
    pushRecord(chair, route, info) {
        if (!this.isRecord)
            return;
        if (this.recordData != null) {
            if (route == 'onRoomInfo')
                return;
            if (route == 'onEnterUser')
                return;
            if (route == 'onErrMsg')
                return;
            if (route == 'onScencePlay')
                return;
            this.recordData.gameData.push({
                chair: chair,
                route: route,
                // 深拷贝
                info: JSON.parse(JSON.stringify(info))
            });
        }
    }
    async saveRecord(drawID) {
        if (this.recordData == null)
            return;
        await dbManager_1.DBManager.get().gameDB.insertDrawVideo(drawID, JSON.stringify(this.recordData));
        this.recordData = null;
    }
}
exports.CTable = CTable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvZ2FtZS90YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxnREFBbUU7QUFDbkUsbURBQTRDO0FBQzVDLDJEQUFzRDtBQUN0RCx1RUFBa0U7QUFDbEUsaURBQTRDO0FBQzVDLG1EQUE4QztBQUc5QyxJQUFLLFNBSUo7QUFKRCxXQUFLLFNBQVM7SUFDVix5Q0FBUSxDQUFBO0lBQ1IsK0NBQU8sQ0FBQTtJQUNQLHlDQUFJLENBQUE7QUFDUixDQUFDLEVBSkksU0FBUyxLQUFULFNBQVMsUUFJYjtBQUVELElBQVksU0FHWDtBQUhELFdBQVksU0FBUztJQUNqQixxREFBYyxDQUFBO0lBQ2QsMkRBQWEsQ0FBQTtBQUNqQixDQUFDLEVBSFcsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFHcEI7QUFFRCxJQUFZLFVBR1g7QUFIRCxXQUFZLFVBQVU7SUFDbEIscURBQWEsQ0FBQTtJQUNiLHVEQUFVLENBQUE7QUFDZCxDQUFDLEVBSFcsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUFHckI7QUF3QlUsUUFBQSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFFOUIsTUFBYSxNQUFNO0lBb0NmLFlBQW9CLEdBQWdCLEVBQUUsT0FBZ0IsRUFBRSxNQUFjO1FBQWxELFFBQUcsR0FBSCxHQUFHLENBQWE7UUFsQ3BDLGlCQUFZLEdBQWUsSUFBSSxDQUFDO1FBRWhDLGFBQVEsR0FBYyxJQUFJLENBQUM7UUFFM0IsWUFBTyxHQUFZLElBQUksQ0FBQztRQUVqQixZQUFPLEdBQWlCLEVBQUUsQ0FBQztRQUVsQyxlQUFVLEdBQWtCLEVBQUUsQ0FBQztRQUUvQixVQUFLLEdBQThCLEVBQUUsQ0FBQyxDQUFNLGVBQWU7UUFFM0QsYUFBUSxHQUFXLENBQUMsQ0FBQztRQUVyQixjQUFTLEdBQWMsQ0FBQyxDQUFDO1FBRXpCLGVBQVUsR0FBZSxVQUFVLENBQUMsU0FBUyxD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