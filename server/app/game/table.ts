import {Application, BackendSession, Channel} from "pinus";
import {getSpend, LEFTONE, SERVER_RULE} from "../../config/config";
import {dispatch} from "../util/dispatcher";
import {DBManager} from './../repositories/dbManager';
import {HallService} from './../servers/hall/service/hallService';
import {Response} from './../util/response';
import {WeChatH5} from "../WeChatH5/WeChatH5";


enum UserState {
    FREE = 0,
    PALYING,
    LOOK
}

export enum GameState {
    SCENE_FREE = 0,
    SCENE_PLAYING
}

export enum StartModel {
    ALL_READY = 0,
    FULL_READY
}

interface IDissRoom {
    applyUser: number;
    state: boolean[];
    timer: NodeJS.Timer;
    endTime: number;
}

interface ITimer {
    timer: NodeJS.Timer;
    endTime: number;
    params: any;
    // 主要用于停止/恢复
    left: number;
}

interface IRecordData {
    roomInfo: IRoomInfo;
    sitUser: ITableUser[];
    gameData: { chair: number, route: string, info: any }[];
}


export var INVALID_CHAIR = -1;

export class CTable implements ITable {

    m_pTableSink: ITableSink = null;

    roomInfo: IRoomInfo = null;

    channel: Channel = null;

    public sitUser: ITableUser[] = [];

    lookonUser: ILookonUser[] = [];

    users: { [key: number]: string } = {};      //userid => sid

    chairCnt: number = 0;

    gameState: GameState = 0;

    startModel: StartModel = StartModel.ALL_READY;

    dissTime: number = 60;

    private startTime: Date = null;

    private writeSaveScore: number[] = [];

    private writeSaveRevenue: number[] = [];

    private dissRoomData: IDissRoom = null;

    private timer: { [key: string]: ITimer } = {};

    private recordData: IRecordData = null;

    private isRecord = true;

    constructor(private app: Application, channel: Channel, KindID: number) {
        this.channel = channel;
        let tableSink = require(`./${KindID}/tableSink`);
        if (tableSink && tableSink.CTableSink) {
            tableSink = tableSink.CTableSink;
            this.m_pTableSink = new tableSink(this);
        }
    }

    public async setRoomInfo(RoomID: number) {
        let res = await DBManager.get().gameDB.getRoomInfo(RoomID);
        res.GameRules = JSON.parse(res.GameRules);
        this.roomInfo = res;
        this.m_pTableSink.setRules(this.roomInfo.GameRules, this.roomInfo.ServerRules);
        this.chairCnt = this.m_pTableSink.getUserCnt();
        let config = await DBManager.get().systemDB.getConfig('DissolveTime');
        if (config) {
            this.dissTime = parseInt(config.ConfigValue);
        }
    }

    public async enterRoom(userID: number, session: BackendSession, gps?: IGPSInfo) {
        let sid = session.get('FrontendID');
        let member = this.channel.getMember(userID + '');
        if (!member) {
            this.channel.add(userID + '', sid);
            this.users[userID] = sid;
        }

        //旁观预留

        let chair;
        let user: ITableUser = this.getSitUser(userID);
        if (!user) {
            chair = this._getNullChair();
            if (chair == INVALID_CHAIR) {
                this.sendMsgByUserID(userID, 'onErrMsg',
                    Response.ERROR('房间已经没有空座了'));
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
            let userInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(userID);
            userInfo.NickName = encodeURI(userInfo.NickName);
            user = {
                UserInfo: userInfo,
                ChairID: chair,
                State: UserState.FREE,
                Ready: false,
                Offline: false,
                Score: await DBManager.get().gameDB.getWriteScore(this.roomInfo.ID, userInfo.UserID),
                sid: sid,
                GPSInfo: gps
            };
            this.m_pTableSink.onEnterUser(chair, user);
        } else {
            chair = user.ChairID;
            user.Offline = false;
        }

        this.sendMsgByUserID(userID, 'onRoomInfo', this.roomInfo);
        this.sendMsgToAll('onEnterUser', [user]);
        this.sendMsgByUserID(userID, 'onEnterUser', this.sitUser);
        this.sitUser[chair] = user;
        this._notifyClub();
        this.isRecord = false;
        let res: boolean = this.m_pTableSink.onScene(chair);
        this.isRecord = true;
        if (!res) {
            this.leave(userID);
            return res;
        }
        if (this.writeSaveScore[chair] == null) this.writeSaveScore[chair] = 0;
        if (this.writeSaveRevenue[chair] == null) this.writeSaveRevenue[chair] = 0;
        if (this.dissRoomData) this.sendMsgByUserID(userID, 'onDissRoomApply', this._getDissData());

        return true;
    }

    public updateGPS(userID: number, data: IGPSInfo) {
        let user = this.getSitUser(userID);
        user.GPSInfo = data;
        this.sendMsgToAll('onEnterUser', [user]);
    }

    async concludeGame(isDiss?: boolean) {
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

    public writeScore(score: number[], revenue?: number[]): void {
        for (let i in this.sitUser) {
            this.writeUserScore(parseInt(i), score[i], revenue ? revenue[i] : 0);
        }
    }

    public writeUserScore(chair: number, score: number, revenue?: number) {
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

    public leave(userID: number) {
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
        DBManager.get().gameDB.delRoomLocker(userID);
    }

    // 房主外部解散
    public async clearRoom() {
        if (this.roomInfo.Process == 0) {
            if (this.roomInfo.ServerRules & SERVER_RULE.CREATE_ROOMCARD) {
                let needCard = getSpend(this.roomInfo.KindID, this.roomInfo.GameRules, this.roomInfo.ServerRules);
                if (this.roomInfo.ServerRules & SERVER_RULE.PAY_CREATOR) {
                    await DBManager.get().accountDB.addRoomCardAndRecord(this.roomInfo.CreatorID, needCard);
                    this.app.rpc.hall.hallRemote.updateUserInfo.toServer(
                        dispatch(this.roomInfo.CreatorID + '', this.app.getServersByType('hall')).id, this.roomInfo.CreatorID);
                } else {
                    for (let user of this.sitUser) {
						if (!user) continue;
                        await DBManager.get().accountDB.addRoomCardAndRecord(user.UserInfo.UserID, needCard);
                    }
                }
            }
        }
        await DBManager.get().gameDB.delRoomLockerByRoomID(this.roomInfo.RoomID);
        await DBManager.get().gameDB.delRoomInfo(this.roomInfo.RoomID);
        if (this.roomInfo.ClubKey) {
            await this.app.rpc.club.clubRemote.updateRoom.toServer(
                dispatch(this.roomInfo.ClubKey + '', this.app.getServersByType('club')).id, this.roomInfo.ClubKey);
        }
        this.channel.destroy();
    }

    public startGame() {
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

    public onGameMsg(userID: number, route: string, data: any) {
        let user = this.getSitUser(userID);
        if (!user) {
            console.log('没有找到玩家 userid:' + userID);
            return;
        }
        let tableSink: any = this.m_pTableSink;
        if (tableSink[route]) {
            let res = tableSink[route](user.ChairID, data);
            if (!res) {
                console.log('route return false ' + route);
            }
        } else {
            console.log('TabelSink 没有 ' + route + ' 接口');
        }
    }

    public userOffline(userID: number) {
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

    public hasEmptyChair() {
        return this._getNullChair() != INVALID_CHAIR;
    }

    public sendMsgByUserID(userID: number, route: string, res: any) {
        this.app.get('channelService').pushMessageByUids(route, res, [{
            uid: userID + '',
            sid: this.users[userID]
        }]);
        return true;
    }

    public sendMsgByChair(chair: number, route: string, res: any, sendLookon?: boolean) {
        let user = this.sitUser[chair];
        if (user && user.ChairID == chair) {
            this.sendMsgByUserID(user.UserInfo.UserID, route, res);
            this.pushRecord(chair, route, res);
        } else {
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

    public sendMsgToAll(route: string, res: any) {
        if (JSON.stringify(this.users) == '{}') return false;
        this.channel.pushMessage(route, res);
        this.pushRecord(INVALID_CHAIR, route, res);
        return true;
    }

    public setTimer(key: string, interval: number, params?: any) {
        if (key == '*') {
            console.log('setTimer Timer Key must not *');
            return;
        }
        let id = setTimeout(this.onEventTimer.bind(this, key), interval);
        let timer: ITimer = {
            timer: id,
            endTime: Date.now() + interval,
            params: params,
            left: 0
        }
        this.timer[key] = timer;
    }

    public clearTimer(key: string) {
        if (key == '*') {
            for (let i in this.timer) {
                clearTimeout(this.timer[i].timer);
                this.timer = {};
            }
        } else {
            let time = this.timer[key];
            if (time) {
                clearTimeout(time.timer);
                delete this.timer[key];
            }
        }
    }

    public stopTimer(key: string) {
        let fn = (time: ITimer) => {
            if (!time) return;
            let now = Date.now();
            clearTimeout(time.timer);
            time.left = time.endTime - now;
        }
        if (key == '*') {
            for (let i in this.timer) {
                fn(this.timer[i]);
            }
        } else {
            fn(this.timer[key]);
        }
    }

    public resumeTimer(key: string) {
        let fn = (time: ITimer, key: string) => {
            if (!time) return;
            if (time.left == 0) return;
            time.timer = setTimeout(this.onEventTimer.bind(this, key), time.left);
            time.left = 0;
            time.endTime = Date.now() + time.left;
        };
        if (key === '*') {
            for (let i in this.timer) {
                fn(this.timer[i], i);
            }
        } else {
            fn(this.timer[key], key);
        }
    }

    public getTimer(key: string): number {
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
    public async onChat(userID: number, data: any) {
        const user = this.getSitUser(userID);
        data.chairID = user.ChairID;
        if (data.sign == 5) {
            data.msg = await WeChatH5.instance.getWeChatVoice(data.msg);
            data.sign = 3;
        }
        this.sendMsgToAll('onChat', data);
    }

    public async userReady(userID: number) {
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

    public userLeave(userID: number) {
        this.sendMsgToAll('onLeaveUser', userID);
        this.leave(userID);
    }

    public dissRoom(userID: number) {
        if (this.roomInfo.Process == 0) {
            if (userID == this.roomInfo.CreatorID) {
                this.sendMsgToAll('onErrMsg', Response.ERROR('房间已经解散!'));
                this.gameConclude();
            } else {
                this.sendMsgByUserID(userID, 'onErrMsg', Response.OK('您不是房主无法解散房间!'));
            }
        } else {
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

    public updateDissRoom(userID: number, state: boolean) {
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
            if (!this.sitUser[i]) continue;
            if (!this.dissRoomData.state[i]) wait++;
            cnt++;
        }
        let left = (cnt != 2 && LEFTONE) ? 1 : 0;
        if (wait == left) {
            this._doDissRoom(true);
        }
    }

    private async _notifyClub() {
        if (this.roomInfo.ClubKey != 0) {
            await this.app.rpc.club.clubRemote.updateRoomInfo.toServer(dispatch(this.roomInfo.ClubKey + '',
                this.app.getServersByType('club')).id, this.roomInfo.ClubKey, this.roomInfo, this.sitUser);
        }
    }

    private async _writeScore(): Promise<void> {
        let userCnt = 0;
        this.sitUser.forEach(user => {
            if (user.State == UserState.PALYING) userCnt++;
        });
        let totalRevenue = 0;
        this.writeSaveRevenue.forEach(rev => totalRevenue += rev);
        let ret = await DBManager.get().gameDB.writeDrawInfo(
            this.roomInfo.KindID,
            this.roomInfo.ID,
            this.roomInfo.RoomID,
            userCnt,
            totalRevenue,
            JSON.stringify(this.roomInfo.GameRules),
            this.roomInfo.ServerRules,
            this.startTime,
            new Date(),
            this.roomInfo.ClubKey);
        let drawID = ret.insertId;
        for (let i in this.sitUser) {
            let user = this.sitUser[i];
            if (user.State != UserState.PALYING) continue;
            await DBManager.get().gameDB.writeDrawScore(
                drawID,
                user.UserInfo.UserID,
                this.roomInfo.ID,
                user.ChairID,
                this.writeSaveScore[i],
                this.writeSaveRevenue[i]);
            if (this.roomInfo.ClubKey) {
                await DBManager.get().clubDB.writeScore(
                    this.roomInfo.ClubKey,
                    user.UserInfo.UserID,
                    this.writeSaveScore[i],
                    this.writeSaveRevenue[i]);
            }
            this.writeSaveScore[i] = 0;
            this.writeSaveRevenue[i] = 0;
        }
        await this.saveRecord(drawID);
    }

    // 游戏内解散
    private async gameConclude() {
        if (this.roomInfo.ClubKey != 0) {
            await HallService.createRoom({
                UserID: this.roomInfo.CreatorID,
                ClubKey: this.roomInfo.ClubKey,
                KindID: this.roomInfo.KindID,
                ServerRules: this.roomInfo.ServerRules,
                GameRules: this.roomInfo.GameRules
            }, this.app);
        }
        await this.clearRoom();
    }

    private checkStart() {
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
                console.log('没有此开始模式! model:' + this.startModel)
                return false;
            }
        }
    }

    private async _updateProcess(process: number) {
        await DBManager.get().gameDB.updateProcess(this.roomInfo.RoomID, process);
        this.roomInfo.Process = process;
        this.sendMsgToAll('onUpdateProcess', process);
        this._notifyClub();
    }

    // onFrameMsg
    ////////////////////////////////////////////////////////////////

    private _getNullChair(): number {
        if (this.getSitCnt() == this.m_pTableSink.getUserCnt()) return INVALID_CHAIR;
        for (var i = 0; i < this.chairCnt; i++) {
            if (this.sitUser[i]) continue;
            return i;
        }
        return INVALID_CHAIR;
    }

    private getSitUser(userID: number) {
        for (var i in this.sitUser) {
            if (this.sitUser[i].UserInfo.UserID === userID) {
                return this.sitUser[i];
            }
        }
        return null;
    }

    private getLookonUser(userID: number) {
        for (var i in this.lookonUser) {
            if (this.lookonUser[i].UserInfo.UserID === userID) {
                return this.lookonUser[i];
            }
        }
        return null;
    }

    private getSitCnt() {
        let cnt = 0;
        for (let user of this.sitUser) {
            if (user) cnt++;
        }
        return cnt;
    }

    private onEventTimer(key: string) {
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

    private _doDissRoom(isDiss: boolean, username?: string) {
        clearTimeout(this.dissRoomData.timer);
        this.dissRoomData = null;
        if (isDiss) {
            this.sendMsgToAll('onDissRoomRes', Response.ERROR('所有玩家同意解散房间, 房间解散!'));
            this.m_pTableSink.concludeGame(INVALID_CHAIR, true);
        } else {
            this.sendMsgToAll('onDissRoomRes', Response.OK(`玩家【${username}】拒绝了解散房间`));
        }
    }

    private _getDissData() {
        return {
            applyUser: this.dissRoomData.applyUser,
            state: this.dissRoomData.state,
            endTime: this.dissRoomData.endTime
        }
    }

    private startRecord() {
        this.recordData = {
            roomInfo: JSON.parse(JSON.stringify(this.roomInfo)),
            sitUser: JSON.parse(JSON.stringify(this.sitUser)),
            gameData: []
        };
    }

    private pushRecord(chair: number, route: string, info: any) {
        if (!this.isRecord) return;
        if (this.recordData != null) {
            if (route == 'onRoomInfo') return;
            if (route == 'onEnterUser') return;
            if (route == 'onErrMsg') return;
            if (route == 'onScencePlay') return;
            this.recordData.gameData.push({
                chair: chair,
                route: route,
                // 深拷贝
                info: JSON.parse(JSON.stringify(info))
            });
        }
    }

    private async saveRecord(drawID: number) {
        if (this.recordData == null) return;
        await DBManager.get().gameDB.insertDrawVideo(drawID, JSON.stringify(this.recordData));
        this.recordData = null;
    }
}