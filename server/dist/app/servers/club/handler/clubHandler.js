"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClubHandler = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const dispatcher_1 = require("../../../util/dispatcher");
const response_1 = require("../../../util/response");
const hallService_1 = require("../../hall/service/hallService");
function default_1(app) {
    return new ClubHandler(app);
}
exports.default = default_1;
class ClubHandler {
    constructor(app) {
        this.app = app;
        this.channelService = null;
        this.channelService = this.app.get('channelService');
    }
    async enter(msg, session) {
        let clubKey = parseInt(session.get('clubKey'));
        let userID = parseInt(session.uid);
        let clubInfo = await dbManager_1.DBManager.get().clubDB.getClubInfoByKey(clubKey);
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        let required = await dbManager_1.DBManager.get().clubDB.getRequiredMembers(clubKey);
        let roomInfo = await dbManager_1.DBManager.get().clubDB.getClubRoom(clubKey);
        if (!userInfo) {
            return response_1.Response.ERROR('您你已经不在此俱乐部中!');
        }
        for (let info of roomInfo) {
            let ret = await this.app.rpc.game.gameRemote.getSitUser.toServer((info.ServerID), (info.RoomID));
            info.users = ret ? ret : [];
        }
        return response_1.Response.OK({
            clubInfo: clubInfo,
            userInfo: userInfo,
            roomInfo: roomInfo,
            required: userInfo.MemberOrder != 0 ? required : []
        });
    }
    async getClubRequire(msg, session) {
        let clubKey = parseInt(session.get('clubKey'));
        let require = await dbManager_1.DBManager.get().clubDB.getRequiredMembers(clubKey);
        return require;
    }
    async doRequire(msg, session) {
        let clubKey = parseInt(session.get('clubKey'));
        let userID = parseInt(session.uid);
        let clubUser = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (clubUser.MemberOrder == 0) {
            return response_1.Response.ERROR('您没有权限操作');
        }
        let state = msg.isAgree ? 1 : 2;
        let requireUsers = await dbManager_1.DBManager.get().clubDB.getRequiredMembers(clubKey);
        // 校验人数上限
        if (state) {
            let config = await dbManager_1.DBManager.get().systemDB.getConfig('ClubMaxUser');
            let maxCnt = -1;
            if (config && config.ConfigValue != '-1') {
                maxCnt = parseInt(config.ConfigValue);
            }
            if (maxCnt != -1) {
                let members = await dbManager_1.DBManager.get().clubDB.getClubMembers(clubKey);
                if (msg.userID == 0 && members.length + requireUsers.length > maxCnt) {
                    return response_1.Response.ERROR('俱乐部成员数量将超过最大上限, 请逐一添加成员');
                }
                if (msg.userID != 0 && members.length + 1 > maxCnt) {
                    return response_1.Response.ERROR('俱乐部成员数量超过最大上限');
                }
            }
        }
        if (msg.userID == 0) {
            await dbManager_1.DBManager.get().clubDB.updateAllJoinStatus(clubKey, state);
        }
        else {
            await dbManager_1.DBManager.get().clubDB.updateJoinStatus(msg.userID, clubKey, state);
        }
        if (msg.isAgree) {
            let info = await dbManager_1.DBManager.get().clubDB.getClubInfoByKey(clubKey);
            let channel = this.channelService.getChannel(clubKey + '', false);
            channel.pushMessage('onUpdateUser', { clubKey: clubKey, userCnt: info.MemberCount });
            // 更新用界面
            let fn = async (userID) => {
                await this.app.rpc.hall.hallRemote.addClub.toServer(dispatcher_1.dispatch(userID + '', this.app.getServersByType('hall')).id, userID, clubKey);
            };
            if (msg.userID == 0 && requireUsers != null) {
                requireUsers.forEach((info) => {
                    if (info.JoinStatus == 0) {
                        fn(info.UserID);
                    }
                });
            }
            else {
                fn(msg.userID);
            }
        }
        let require = await dbManager_1.DBManager.get().clubDB.getRequiredMembers(clubKey);
        return response_1.Response.OK(require);
    }
    async getClubMember(msg, session) {
        let clubKey = parseInt(session.get('clubKey'));
        return await dbManager_1.DBManager.get().clubDB.getClubMembers(clubKey);
    }
    async dissClubRoom(msg, session) {
        let roomInfo = await dbManager_1.DBManager.get().gameDB.getRoomInfo(msg.roomID);
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (userInfo.MemberOrder == 0) {
            return response_1.Response.ERROR('您没有权限做此操作!');
        }
        if (!msg.force && roomInfo.Process > 0) {
            return response_1.Response.ERROR('游戏已经开始,无法解散房间');
        }
        await this.app.rpc.game.gameRemote.dissRoom.toServer(roomInfo.ServerID, msg.roomID, msg.force);
        return response_1.Response.OK('解散成功!');
    }
    async kickUser(msg, session) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        if (msg.userID == userID) {
            return response_1.Response.ERROR('您不能将自己踢出!');
        }
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (userInfo.MemberOrder == 0) {
            return response_1.Response.ERROR('您没有权限做此操作!');
        }
        let kickUser = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        if (!kickUser) {
            return response_1.Response.ERROR('无此玩家!');
        }
        if (kickUser.MemberOrder == 2) {
            return response_1.Response.ERROR('您没有权限做此操作!');
        }
        await dbManager_1.DBManager.get().clubDB.deleteClubMember(clubKey, msg.userID);
        let users = await dbManager_1.DBManager.get().clubDB.getClubMembers(clubKey);
        let channel = this.channelService.getChannel(clubKey + '', false);
        channel.pushMessage('onUpdateUser', { clubKey: clubKey, userCnt: users.length });
        this.channelService.pushMessageByUids('onLeaveClub', { clubKey: clubKey }, [channel.getMember(msg.userID + '')]);
        return response_1.Response.OK(users);
    }
    async addScore(msg, session) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (!userInfo) {
            return response_1.Response.ERROR('您你已经不在此俱乐部中!');
        }
        let tagUser = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        if (!tagUser) {
            return response_1.Response.ERROR('该用户已经离开俱乐部');
        }
        if (userInfo.MemberOrder == 0) {
            return response_1.Response.ERROR('您没有权限做此操作!');
        }
        // if (userInfo.MemberOrder != 2 && userInfo.Score < msg.score) {
        //     return Response.ERROR('您的积分不足!');
        // }
        if (msg.score == 0) {
            msg.score = -tagUser.Score;
        }
        await dbManager_1.DBManager.get().clubDB.addScoreLog(clubKey, userID, userInfo.Score, msg.userID, tagUser.Score, msg.score);
        await dbManager_1.DBManager.get().clubDB.addScore(clubKey, msg.userID, msg.score);
        // if (userInfo.MemberOrder != 2 || (msg.score < 0 && userID != tagUser.UserID)) {
        //     await DBManager.get().clubDB.addScore(clubKey, userID, -msg.score);
        // }
        userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        tagUser = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        let channel = this.channelService.getChannel(clubKey + '', false);
        let info = channel.getMember(msg.userID + '');
        if (!!info) {
            this.channelService.pushMessageByUids('updateUserInfo', tagUser, [info]);
        }
        return response_1.Response.OK({
            userInfo: userInfo,
            tagUser: tagUser,
        });
    }
    async getScoreLog(msg, session) {
        let clubKey = parseInt(session.get('clubKey'));
        let info = await dbManager_1.DBManager.get().clubDB.getScoreLog(clubKey);
        info.forEach((row) => {
            row.CreateTime = row.CreateTime.fmt('yyyy-MM-dd hh:mm:ss');
        });
        return info;
    }
    async dissOrExitClub(msg, session) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        let channel = this.channelService.getChannel(clubKey + '', false);
        if (userInfo.MemberOrder == 2) {
            // 解散
            let roomInfo = await dbManager_1.DBManager.get().clubDB.getClubRoom(clubKey);
            for (let room of roomInfo) {
                await this.dissClubRoom({
                    roomID: room.RoomID,
                    force: true,
                }, session);
            }
            await dbManager_1.DBManager.get().clubDB.deleteClub(clubKey);
            channel.pushMessage('onLeaveClub', { clubKey: clubKey });
            channel.destroy();
        }
        else {
            // 退出
            await dbManager_1.DBManager.get().clubDB.exitClub(clubKey, userID);
            let info = await dbManager_1.DBManager.get().clubDB.getClubInfoByKey(clubKey);
            channel.pushMessage('onUpdateUser', { clubKey: clubKey, userCnt: info.MemberCount });
            this.channelService.pushMessageByUids('onLeaveClub', { clubKey: clubKey }, [channel.getMember(userID + '')]);
        }
        return response_1.Response.OK('操作成功');
    }
    async setUserManager(msg, session) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (userInfo.MemberOrder != 2) {
            return response_1.Response.ERROR('权限不足');
        }
        if (msg.isGameID) {
            let user = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByGameID(msg.userID);
            if (!user) {
                return response_1.Response.ERROR('用户不存在');
            }
            msg.userID = user.UserID;
        }
        if (msg.state) {
            let config = await dbManager_1.DBManager.get().systemDB.getConfig('MaxManagerCnt');
            if (config && config.ConfigValue != '-1') {
                let members = await dbManager_1.DBManager.get().clubDB.getClubMembers(clubKey);
                let managerCnt = 0;
                for (let user of members) {
                    if (user.MemberOrder == 1)
                        managerCnt++;
                    if (managerCnt >= parseInt(config.ConfigValue)) {
                        return response_1.Response.ERROR('管理员数量超过上限');
                    }
                }
            }
        }
        let tarUser = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        if (!tarUser) {
            return response_1.Response.ERROR('用户不存在');
        }
        if (tarUser.MemberOrder == 2) {
            return response_1.Response.ERROR('您不能设置部长');
        }
        if (msg.state && tarUser.MemberOrder == 1) {
            return response_1.Response.ERROR('该用户已经是管理员, 无需重新设置');
        }
        await dbManager_1.DBManager.get().clubDB.updateUserOrder(clubKey, msg.userID, msg.state ? 1 : 0);
        let target = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        let channel = this.channelService.getChannel(clubKey + '', false);
        this.channelService.pushMessageByUids('onUpdateManager', { clubKey: clubKey, userInfo: target }, [channel.getMember(msg.userID + '')]);
        return response_1.Response.OK(await dbManager_1.DBManager.get().clubDB.getClubMembers(clubKey));
    }
    async getClubRecords(msg, session) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await dbManager_1.DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        let ret = [];
        if (userInfo.MemberOrder > 0) {
            ret = await dbManager_1.DBManager.get().clubDB.getClubDrawInfo(clubKey);
        }
        else {
            ret = await dbManager_1.DBManager.get().clubDB.getClubUserDrawInfo(clubKey, userID);
        }
        return hallService_1.HallService.getGameRecord(ret);
    }
    async leave(msg, session) {
        let clubKey = parseInt(session.get('clubKey'));
        if (clubKey) {
            let channel = this.app.get('channelService').getChannel(clubKey + '', false);
            let user = channel.getMember(session.uid);
            if (!!channel && !!user) {
                channel.leave(user.uid, user.sid);
            }
        }
    }
}
exports.ClubHandler = ClubHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1YkhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9jbHViL2hhbmRsZXIvY2x1YkhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0RBQTREO0FBQzVELHlEQUFvRDtBQUNwRCxxREFBa0Q7QUFDbEQsZ0VBQTZEO0FBRzdELG1CQUF5QixHQUFnQjtJQUNyQyxPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFGRCw0QkFFQztBQUdELE1BQWEsV0FBVztJQUlwQixZQUFvQixHQUFnQjtRQUFoQixRQUFHLEdBQUgsR0FBRyxDQUFhO1FBRnBDLG1CQUFjLEdBQW1CLElBQUksQ0FBQTtRQUdqQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBUSxFQUFFLE9BQXVCO1FBQ3pDLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxJQUFJLFFBQVEsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RFLElBQUksUUFBUSxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3RSxJQUFJLFFBQVEsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hF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