import { Application } from 'pinus';
import { getSpend, SERVER_RULE } from "../../../../config/config";
import { DBManager } from "../../../repositories/dbManager";
import { dispatch } from '../../../util/dispatcher';
import { Response } from "../../../util/response";



export class HallService {
    //获取滚动公告
    public static async getRollNotice() {
        let notices = await DBManager.get().systemDB.getNotice(0);
        if (!notices || notices.length == 0)
            return Response.ERROR('暂无滚动公告内容。');

        return Response.OK({
            Content: notices[0].NoticeContent
        });
    }

    public static async getGameRecord(ret: any[]) {
        let serverID: number[] = [];
        ret.forEach((row: any) => serverID.push(row.ServiceID));
        let scoreInfo: any[] = [];
        if (ret.length > 0) {
            scoreInfo = await DBManager.get().gameDB.getDrawInfoUser(serverID);
        }
        //玩家分数根据房间分组
        let user: any = {};
        scoreInfo.forEach((row: any) => {
            if (user[row.ServiceID] == null) {
                user[row.ServiceID] = [];
            }
            user[row.ServiceID].push({
                userID: row.UserID,
                score: row.Score
            });
        });
        ret.forEach((row: any) => {
            row.user = user[row.ServiceID];
            if (row.StartTime) {
                row.StartTime = row.StartTime.fmt('yyyy-MM-dd hh:mm:ss');
            }
        });
        return Response.OK(ret);
    }

    public static async createRoom(msg: ICreateRoom, app: Application) {

        // 校验后台是否开启此游戏
        let ret = await DBManager.get().gameDB.getGameOption(msg.KindID);
        // 校验服务器是否开启
        let servers = app.getServersByType('game');
        if (!servers || servers.length === 0) return Response.ERROR('游戏服务未启动!');
        if (!ret || !ret.IsOpen) {
            return Response.ERROR('游戏暂未开放!');
        }

        // 校验是否有此游戏
        let tableSink = require(`../../../game/${msg.KindID}/tableSink`).CTableSink;
        if (!tableSink) return Response.ERROR('没有找到游戏文件');

        // 校验玩家
        let userInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(msg.UserID);
        if (!userInfo) {
            return Response.ERROR('玩家信息异常!');
        }

        // 消耗
        if (msg.ServerRules & (SERVER_RULE.CREATE_ROOMCARD | SERVER_RULE.CREATE_GOLD)) {
            let scoreInfo;
            if (0 != msg.ClubKey) {
                let clubInfo = await DBManager.get().clubDB.getClubInfoByKey(msg.ClubKey);
                if (!clubInfo) return Response.ERROR('俱乐部不存在!');
                scoreInfo = await DBManager.get().accountDB.getScoreInfo(clubInfo.MasterID);
            } else {
                scoreInfo = await DBManager.get().accountDB.getScoreInfo(msg.UserID);
            }
            //消耗房卡
            if (msg.ServerRules & SERVER_RULE.CREATE_ROOMCARD) {
                let needCard: number = getSpend(msg.KindID, msg.GameRules, msg.ServerRules);
                if (scoreInfo.RoomCard > needCard) {
                    await DBManager.get().accountDB.addRoomCardAndRecord(scoreInfo.UserID, -needCard);
                    app.rpc.hall.hallRemote.updateUserInfo.toServer(
                        dispatch(scoreInfo.UserID+'', app.getServersByType('hall')).id, scoreInfo.UserID);
                } else {
                    return Response.ERROR('房卡不足!');
                }
            }
        }

        // debug模式 生成连续房间号
        let rand = app.get('env') == 'development' ? 0 : 1;

        // 生成房间表
        let roomInfo = await DBManager.get().gameDB.createRoom(msg.KindID,
            msg.ServerRules, JSON.stringify(msg.GameRules), msg.ClubKey,
            msg.UserID, rand);

        // 分配服务器
        var server = dispatch(roomInfo.ID + '', servers);
        await DBManager.get().gameDB.updateServerID(roomInfo.RoomID, server.id);
        roomInfo.ServerID = server.id;

        await app.rpc.game.gameRemote.setRoomInfo.toServer(server.id, roomInfo.RoomID, roomInfo.KindID);

        if (msg.ClubKey) {
            await app.rpc.club.clubRemote.updateRoom.toServer(
                dispatch(msg.ClubKey + '', app.getServersByType('club')).id, msg.ClubKey);
        }
        return Response.OK({
            serverID: server.id,
            userInfo: userInfo,
            roomInfo: roomInfo
        });
    }

}