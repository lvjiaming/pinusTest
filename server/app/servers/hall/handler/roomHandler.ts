import { Application, BackendSession } from 'pinus';
import { getSpend, SERVER_RULE } from '../../../../config/config';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from '../../../util/response';
import { HallService } from '../service/hallService';


export default function (app: Application) {
    return new RoomHandler(app);
}

export class RoomHandler {
    constructor(private app: Application) {
    }


    private async createRoom(msg: ICreateRoom, session: BackendSession) {
        let res = await HallService.createRoom(msg, this.app);
        console.log("房间信息：", msg);
        if (res.status != 0) return res;
        // 代开
        if (msg.ServerRules & SERVER_RULE.AGENCY_CREATE) {
            return Response.ERROR('创建房间成功!');
        } else {
            // 进入
            this._bindServerID(res.data.serverID, session);
            return await this._doEnter(res.data.userInfo, res.data.roomInfo, session);
        }
    }

    private async joinRoom(msg: { roomID: number }, session: BackendSession) {
        let userID: number = parseInt(session.uid);
        // 校验玩家
        let userInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!userInfo) {
            return Response.ERROR('玩家信息异常!');
        }
        // 校验是否已经在房间里
        let roomIn = await this._checkRoomIn(userID, session);
        if (roomIn) {
            return roomIn;
        }
        // 校验房间是否存在
        let roomInfo = await DBManager.get().gameDB.getRoomInfo(msg.roomID);
        if (!roomInfo || !roomInfo.ServerID) return Response.ERROR('房间不存在!');
        if (roomInfo.ClubKey) {
            let userInfo = await DBManager.get().clubDB.getClubUserInfo(roomInfo.ClubKey, userID);
            if (!userInfo) return Response.ERROR('您不是该俱乐部成员无法进入!');
        }

        // 消耗
        let needCard = 0;
        if ((roomInfo.ServerRules & SERVER_RULE.PAY_AA) > 0) {
            let scoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);
            if (!scoreInfo) return Response.ERROR('用户信息异常!');

            let tableSink = require(`../../../game/${roomInfo.KindID}/tableSink`).CTableSink;
            if (!tableSink) return Response.ERROR('没有找到游戏文件');

            needCard = getSpend(roomInfo.KindID, JSON.parse(roomInfo.GameRules), roomInfo.ServerRules);
            if (scoreInfo.RoomCard > needCard) {
                await DBManager.get().accountDB.addRoomCardAndRecord(userID, -needCard);
            } else {
                return Response.ERROR('房卡不足!');
            }
        }

        // 绑定ServerID用于路由
        this._bindServerID(roomInfo.ServerID, session);
        // 校验房间是否坐满
        let res = await this.app.rpc.game.gameRemote.hasEmptyChair.route(session)(msg.roomID);
        if (!res) {
            // 进入失败补房卡
            if ((roomInfo.ServerRules & SERVER_RULE.CREATE_ROOMCARD) &&
                (roomInfo.ServerRules & SERVER_RULE.PAY_AA)) {
                await DBManager.get().accountDB.addRoomCardAndRecord(userID, needCard);
            }
            // 注销ServerID
            this._bindServerID('', session);
            return Response.ERROR('房间已经没有空座位了!');
        }

        // 进入
        return await this._doEnter(userInfo, roomInfo, session);
    }

    private _bindServerID(serverID: string, session: BackendSession) {
        session.set('ServerID', serverID);
        session.push('ServerID', function (err) {
            if (err) {
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });
    }

    private async _doEnter(userInfo: any, roomInfo: any, session: BackendSession) {
        // 离开大厅
        let channel = this.app.get('channelService').getChannel('Hall');
        if (!!channel) {
            channel.leave(session.uid, session.get('FrontendID'));
        }
        // 插入locker表
        await DBManager.get().gameDB.insertRoomLocker(userInfo.UserID, roomInfo.KindID, roomInfo.RoomID, userInfo.LastLogonIP);

        return Response.OK({
            RoomID: roomInfo.RoomID,
            KindID: roomInfo.KindID
        } as IRoomBaseInfo);
    }

    private async _checkRoomIn(user: number, session: BackendSession) {
        // 校验locker表
        let inRoom = await DBManager.get().gameDB.getInRoom(user);
        if (inRoom) {
            // 校验房间表
            let roomInfo = await DBManager.get().gameDB.getRoomInfo(inRoom.ServerID);
            if (roomInfo) {
                // 绑定ServerID用于路由
                this._bindServerID(roomInfo.ServerID, session);
                return Response.OK('当前正在游戏中, 请进入', {
                    RoomID: roomInfo.RoomID,
                    KindID: roomInfo.KindID
                } as IRoomBaseInfo)
            }
        }
        return null;
    }
}
