import { Application, BackendSession, ChannelService } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { dispatch } from "../../../util/dispatcher";
import { Response } from '../../../util/response';
import { HallService } from "../../hall/service/hallService";


export default function (app: Application) {
    return new ClubHandler(app);
}


export class ClubHandler {

    channelService: ChannelService = null

    constructor(private app: Application) {
        this.channelService = this.app.get('channelService');
    }

    async enter(msg: any, session: BackendSession) {
        let clubKey = parseInt(session.get('clubKey'));
        let userID = parseInt(session.uid);
        let clubInfo = await DBManager.get().clubDB.getClubInfoByKey(clubKey);
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        let required = await DBManager.get().clubDB.getRequiredMembers(clubKey);
        let roomInfo = await DBManager.get().clubDB.getClubRoom(clubKey);
        if (!userInfo) {
            return Response.ERROR('您你已经不在此俱乐部中!');
        }
        for (let info of roomInfo) {
            let ret = await this.app.rpc.game.gameRemote.getSitUser.toServer(<string>(info.ServerID), <any>(info.RoomID));
            info.users = ret ? ret : [];
        }
        return Response.OK({
            clubInfo: clubInfo,
            userInfo: userInfo,
            roomInfo: roomInfo,
            required: userInfo.MemberOrder != 0 ? required : []
        });
    }

    async getClubRequire(msg: any, session: BackendSession) {
        let clubKey = parseInt(session.get('clubKey'));
        let require = await DBManager.get().clubDB.getRequiredMembers(clubKey);
        return require;
    }

    async doRequire(msg: { isAgree: boolean, userID: number }, session: BackendSession) {
        let clubKey = parseInt(session.get('clubKey'));
        let userID = parseInt(session.uid);
        let clubUser = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (clubUser.MemberOrder == 0) {
            return Response.ERROR('您没有权限操作');
        }
        let state = msg.isAgree ? 1 : 2;
        let requireUsers = await DBManager.get().clubDB.getRequiredMembers(clubKey);
        // 校验人数上限
        if (state) {
            let config = await DBManager.get().systemDB.getConfig('ClubMaxUser');
            let maxCnt = -1;
            if (config && config.ConfigValue != '-1') {
                maxCnt = parseInt(config.ConfigValue);
            }
            if (maxCnt != -1) {
                let members = await DBManager.get().clubDB.getClubMembers(clubKey);
                if (msg.userID == 0 && members.length + requireUsers.length > maxCnt) {
                    return Response.ERROR('俱乐部成员数量将超过最大上限, 请逐一添加成员');
                }
                if (msg.userID != 0 && members.length + 1 > maxCnt) {
                    return Response.ERROR('俱乐部成员数量超过最大上限');
                }
            }
        }
        if (msg.userID == 0) {
            await DBManager.get().clubDB.updateAllJoinStatus(clubKey, state);
        } else {
            await DBManager.get().clubDB.updateJoinStatus(msg.userID, clubKey, state);
        }
        if (msg.isAgree) {
            let info = await DBManager.get().clubDB.getClubInfoByKey(clubKey);
            let channel = this.channelService.getChannel(clubKey + '', false);
            channel.pushMessage('onUpdateUser', { clubKey: clubKey, userCnt: info.MemberCount });
            // 更新用界面
            let fn = async (userID: number)=> {
                await this.app.rpc.hall.hallRemote.addClub.toServer(dispatch(userID + '', this.app.getServersByType('hall')).id, userID, clubKey);
            };
            if (msg.userID == 0 && requireUsers != null) {
                requireUsers.forEach((info: any)=> {
                    if (info.JoinStatus == 0) {
                        fn(info.UserID);
                    }
                })
            } else {
                fn(msg.userID);
            }
        }
        let require = await DBManager.get().clubDB.getRequiredMembers(clubKey);
        return Response.OK(require);
    }

    async getClubMember(msg: any, session: BackendSession) {
        let clubKey = parseInt(session.get('clubKey'));
        return await DBManager.get().clubDB.getClubMembers(clubKey);
    }

    async dissClubRoom(msg: { roomID: number, force: boolean }, session: BackendSession) {
        let roomInfo = await DBManager.get().gameDB.getRoomInfo(msg.roomID);
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (userInfo.MemberOrder == 0) {
            return Response.ERROR('您没有权限做此操作!');
        }
        if (!msg.force && roomInfo.Process > 0) {
            return Response.ERROR('游戏已经开始,无法解散房间');
        }
        await this.app.rpc.game.gameRemote.dissRoom.toServer(roomInfo.ServerID, msg.roomID, msg.force);
        return Response.OK('解散成功!');
    }

    async kickUser(msg: { userID: number }, session: BackendSession) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        if (msg.userID == userID) {
            return Response.ERROR('您不能将自己踢出!');
        }
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (userInfo.MemberOrder == 0) {
            return Response.ERROR('您没有权限做此操作!');
        }
        let kickUser = await DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        if (!kickUser) {
            return Response.ERROR('无此玩家!');
        }
        if (kickUser.MemberOrder == 2) {
            return Response.ERROR('您没有权限做此操作!');
        }
        await DBManager.get().clubDB.deleteClubMember(clubKey, msg.userID);
        let users = await DBManager.get().clubDB.getClubMembers(clubKey);
        let channel = this.channelService.getChannel(clubKey + '', false);
        channel.pushMessage('onUpdateUser', { clubKey: clubKey, userCnt: users.length });
        this.channelService.pushMessageByUids('onLeaveClub', { clubKey: clubKey }, [channel.getMember(msg.userID + '')]);
        return Response.OK(users);
    }

    async addScore(msg: { userID: number, score: number }, session: BackendSession) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (!userInfo) {
            return Response.ERROR('您你已经不在此俱乐部中!');
        }
        let tagUser = await DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        if (!tagUser) {
            return Response.ERROR('该用户已经离开俱乐部');
        }
        if (userInfo.MemberOrder == 0) {
            return Response.ERROR('您没有权限做此操作!');
        }
        // if (userInfo.MemberOrder != 2 && userInfo.Score < msg.score) {
        //     return Response.ERROR('您的积分不足!');
        // }
        if (msg.score == 0) {
            msg.score = -tagUser.Score;
        }
        await DBManager.get().clubDB.addScoreLog(clubKey, userID, userInfo.Score, msg.userID, tagUser.Score, msg.score);
        await DBManager.get().clubDB.addScore(clubKey, msg.userID, msg.score);
        // if (userInfo.MemberOrder != 2 || (msg.score < 0 && userID != tagUser.UserID)) {
        //     await DBManager.get().clubDB.addScore(clubKey, userID, -msg.score);
        // }
        userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        tagUser = await DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        let channel = this.channelService.getChannel(clubKey + '', false);
        let info = channel.getMember(msg.userID + '');
        if (!!info) {
            this.channelService.pushMessageByUids('updateUserInfo', tagUser, [info]);
        }
        return Response.OK({
            userInfo: userInfo,
            tagUser: tagUser,
        })
    }

    async getScoreLog(msg: any, session: BackendSession) {
        let clubKey = parseInt(session.get('clubKey'));
        let info = await DBManager.get().clubDB.getScoreLog(clubKey);
        info.forEach((row: any) => {
            row.CreateTime = row.CreateTime.fmt('yyyy-MM-dd hh:mm:ss');
        });
        return info;
    }

    async dissOrExitClub(msg: any, session: BackendSession) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        let channel = this.channelService.getChannel(clubKey + '', false);
        if (userInfo.MemberOrder == 2) {
            // 解散
            let roomInfo = await DBManager.get().clubDB.getClubRoom(clubKey);
            for (let room of roomInfo) {
                await this.dissClubRoom({
                    roomID: room.RoomID,
                    force: true,
                }, session);
            }
            await DBManager.get().clubDB.deleteClub(clubKey);
            channel.pushMessage('onLeaveClub', { clubKey: clubKey });
            channel.destroy();
        } else {
            // 退出
            await DBManager.get().clubDB.exitClub(clubKey, userID);
            let info = await DBManager.get().clubDB.getClubInfoByKey(clubKey);
            channel.pushMessage('onUpdateUser', { clubKey: clubKey, userCnt: info.MemberCount });
            this.channelService.pushMessageByUids('onLeaveClub', { clubKey: clubKey }, [channel.getMember(userID + '')]);
        }
        return Response.OK('操作成功');
    }

    async setUserManager(msg: { userID: number, state: boolean, isGameID: boolean }, session: BackendSession) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        if (userInfo.MemberOrder != 2) {
            return Response.ERROR('权限不足');
        }
        if (msg.isGameID) {
            let user = await DBManager.get().accountDB.getAccountsInfoByGameID(msg.userID);
            if (!user) {
                return Response.ERROR('用户不存在');
            }
            msg.userID = user.UserID;
        }
        if (msg.state) {
            let config = await DBManager.get().systemDB.getConfig('MaxManagerCnt');
            if (config && config.ConfigValue != '-1') {
                let members = await DBManager.get().clubDB.getClubMembers(clubKey);
                let managerCnt = 0;
                for (let user of members) {
                    if (user.MemberOrder == 1) managerCnt++;
                    if (managerCnt >= parseInt(config.ConfigValue)) {
                        return Response.ERROR('管理员数量超过上限');
                    }
                }
            }
        }

        let tarUser = await DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        if (!tarUser) {
            return Response.ERROR('用户不存在');
        }
        if (tarUser.MemberOrder == 2) {
            return Response.ERROR('您不能设置部长');
        }
        if (msg.state && tarUser.MemberOrder == 1) {
            return Response.ERROR('该用户已经是管理员, 无需重新设置');
        }
        await DBManager.get().clubDB.updateUserOrder(clubKey, msg.userID, msg.state ? 1 : 0);
        let target = await DBManager.get().clubDB.getClubUserInfo(clubKey, msg.userID);
        let channel = this.channelService.getChannel(clubKey + '', false);
        this.channelService.pushMessageByUids('onUpdateManager', { clubKey: clubKey, userInfo: target }, [channel.getMember(msg.userID + '')]);
        return Response.OK(await DBManager.get().clubDB.getClubMembers(clubKey));
    }

    async getClubRecords(msg: any, session: BackendSession) {
        let userID = parseInt(session.uid);
        let clubKey = parseInt(session.get('clubKey'));
        let userInfo = await DBManager.get().clubDB.getClubUserInfo(clubKey, userID);
        let ret: any[] = [];
        if (userInfo.MemberOrder > 0) {
            ret = await DBManager.get().clubDB.getClubDrawInfo(clubKey);
        } else {
            ret = await DBManager.get().clubDB.getClubUserDrawInfo(clubKey, userID);
        }
        return HallService.getGameRecord(ret);
    }

    async leave(msg: any, session: BackendSession) {
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
