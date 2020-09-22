"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomHandler = void 0;
const config_1 = require("../../../../config/config");
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
const hallService_1 = require("../service/hallService");
function default_1(app) {
    return new RoomHandler(app);
}
exports.default = default_1;
class RoomHandler {
    constructor(app) {
        this.app = app;
    }
    async createRoom(msg, session) {
        let res = await hallService_1.HallService.createRoom(msg, this.app);
        console.log("房间信息：", msg);
        if (res.status != 0)
            return res;
        // 代开
        if (msg.ServerRules & config_1.SERVER_RULE.AGENCY_CREATE) {
            return response_1.Response.ERROR('创建房间成功!');
        }
        else {
            // 进入
            this._bindServerID(res.data.serverID, session);
            return await this._doEnter(res.data.userInfo, res.data.roomInfo, session);
        }
    }
    async joinRoom(msg, session) {
        let userID = parseInt(session.uid);
        // 校验玩家
        let userInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!userInfo) {
            return response_1.Response.ERROR('玩家信息异常!');
        }
        // 校验是否已经在房间里
        let roomIn = await this._checkRoomIn(userID, session);
        if (roomIn) {
            return roomIn;
        }
        // 校验房间是否存在
        let roomInfo = await dbManager_1.DBManager.get().gameDB.getRoomInfo(msg.roomID);
        if (!roomInfo || !roomInfo.ServerID)
            return response_1.Response.ERROR('房间不存在!');
        if (roomInfo.ClubKey) {
            let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(roomInfo.ClubKey, userID);
            if (!userInfo)
                return response_1.Response.ERROR('您不是该俱乐部成员无法进入!');
        }
        // 消耗
        let needCard = 0;
        if ((roomInfo.ServerRules & config_1.SERVER_RULE.PAY_AA) > 0) {
            let scoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
            if (!scoreInfo)
                return response_1.Response.ERROR('用户信息异常!');
            let tableSink = require(`../../../game/${roomInfo.KindID}/tableSink`).CTableSink;
            if (!tableSink)
                return response_1.Response.ERROR('没有找到游戏文件');
            needCard = config_1.getSpend(roomInfo.KindID, JSON.parse(roomInfo.GameRules), roomInfo.ServerRules);
            if (scoreInfo.RoomCard > needCard) {
                await dbManager_1.DBManager.get().accountDB.addRoomCardAndRecord(userID, -needCard);
            }
            else {
                return response_1.Response.ERROR('房卡不足!');
            }
        }
        // 绑定ServerID用于路由
        this._bindServerID(roomInfo.ServerID, session);
        // 校验房间是否坐满
        let res = await this.app.rpc.game.gameRemote.hasEmptyChair.route(session)(msg.roomID);
        if (!res) {
            // 进入失败补房卡
            if ((roomInfo.ServerRules & config_1.SERVER_RULE.CREATE_ROOMCARD) &&
                (roomInfo.ServerRules & config_1.SERVER_RULE.PAY_AA)) {
                await dbManager_1.DBManager.get().accountDB.addRoomCardAndRecord(userID, needCard);
            }
            // 注销ServerID
            this._bindServerID('', session);
            return response_1.Response.ERROR('房间已经没有空座位了!');
        }
        // 进入
        return await this._doEnter(userInfo, roomInfo, session);
    }
    _bindServerID(serverID, session) {
        session.set('ServerID', serverID);
        session.push('ServerID', function (err) {
            if (err) {
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });
    }
    async _doEnter(userInfo, roomInfo, session) {
        // 离开大厅
        let channel = this.app.get('channelService').getChannel('Hall');
        if (!!channel) {
            channel.leave(session.uid, session.get('FrontendID'));
        }
        // 插入locker表
        await dbManager_1.DBManager.get().gameDB.insertRoomLocker(userInfo.UserID, roomInfo.KindID, roomInfo.RoomID, userInfo.LastLogonIP);
        return response_1.Response.OK({
            RoomID: roomInfo.RoomID,
            KindID: roomInfo.KindID
        });
    }
    async _checkRoomIn(user, session) {
        // 校验locker表
        let inRoom = await dbManager_1.DBManager.get().gameDB.getInRoom(user);
        if (inRoom) {
            // 校验房间表
            let roomInfo = await dbManager_1.DBManager.get().gameDB.getRoomInfo(inRoom.ServerID);
            if (roomInfo) {
                // 绑定ServerID用于路由
                this._bindServerID(roomInfo.ServerID, session);
                return response_1.Response.OK('当前正在游戏中, 请进入', {
                    RoomID: roomInfo.RoomID,
                    KindID: roomInfo.KindID
                });
            }
        }
        return null;
    }
}
exports.RoomHandler = RoomHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9vbUhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9oYWxsL2hhbmRsZXIvcm9vbUhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esc0RBQWtFO0FBQ2xFLCtEQUE0RDtBQUM1RCxxREFBa0Q7QUFDbEQsd0RBQXFEO0FBR3JELG1CQUF5QixHQUFnQjtJQUNyQyxPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFGRCw0QkFFQztBQUVELE1BQWEsV0FBVztJQUNwQixZQUFvQixHQUFnQjtRQUFoQixRQUFHLEdBQUgsR0FBRyxDQUFhO0lBQ3BDLENBQUM7SUFHTyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQWdCLEVBQUUsT0FBdUI7UUFDOUQsSUFBSSxHQUFHLEdBQUcsTUFBTSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQUUsT0FBTyxHQUFHLENBQUM7UUFDaEMsS0FBSztRQUNMLElBQUksR0FBRyxDQUFDLFdBQVcsR0FBRyxvQkFBVyxDQUFDLGFBQWEsRUFBRTtZQUM3QyxPQUFPLG1CQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3BDO2FBQU07WUFDSCxLQUFLO1lBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQyxPQUFPLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM3RTtJ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