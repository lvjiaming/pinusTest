"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallClubHandler = void 0;
const dispatcher_1 = require("../../../util/dispatcher");
const dbManager_1 = require("./../../../repositories/dbManager");
const response_1 = require("./../../../util/response");
function default_1(app) {
    return new HallClubHandler(app);
}
exports.default = default_1;
class HallClubHandler {
    constructor(app) {
        this.app = app;
        this.channelService = null;
        this.channelService = this.app.get('channelService');
    }
    async createClub(msg, session) {
        let userID = parseInt(session.uid);
        let userScore = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        if (userScore.RoomCard < 100) {
            return response_1.Response.ERROR('您必须拥有100张房卡以上才能创建俱乐部!');
        }
        let clubList = await dbManager_1.DBManager.get().clubDB.getClubList(userID);
        if (clubList.length >= 5) {
            return response_1.Response.ERROR('俱乐部数量超过上限!');
        }
        let clubInfo = await dbManager_1.DBManager.get().clubDB.createClub(userID, msg.name);
        clubInfo.TableCnt = await dbManager_1.DBManager.get().clubDB.getTableCnt(clubInfo.ClubKey);
        let config = await dbManager_1.DBManager.get().systemDB.getConfig('ClubMaxUser');
        if (config && config.ConfigValue != '-1') {
            clubInfo.MaxUserCnt = parseInt(config.ConfigValue);
        }
        await this.app.rpc.club.clubRemote.add.toServer(dispatcher_1.dispatch(clubInfo.ClubKey + '', this.app.getServersByType('club')).id, clubInfo.ClubKey, session.uid, session.get('FrontendID'));
        this.channelService.pushMessageByUids('onAddClub', clubInfo, [{
                uid: session.uid,
                sid: session.get('FrontendID')
            }]);
        return response_1.Response.OK(`俱乐部创建成功,ID:${clubInfo.ClubID}`);
    }
    async joinClub(msg, session) {
        let userID = parseInt(session.uid);
        let clubInfo = await dbManager_1.DBManager.get().clubDB.getClubInfo(msg.clubID);
        if (!clubInfo) {
            return response_1.Response.ERROR('俱乐部不存在!');
        }
        let joinStatus = await dbManager_1.DBManager.get().clubDB.getJoinStatus(userID, clubInfo.ClubKey);
        if (joinStatus == null) {
            await dbManager_1.DBManager.get().clubDB.joinClub(userID, clubInfo.ClubKey);
        }
        else if (joinStatus.JoinStatus == 2) {
            await dbManager_1.DBManager.get().clubDB.updateJoinStatus(userID, clubInfo.ClubKey, 0);
        }
        else if (joinStatus.JoinStatus == 0) {
            return response_1.Response.ERROR('您已经申请过了, 请耐心等待管理员同意');
        }
        else if (joinStatus.JoinStatus == 1) {
            return response_1.Response.ERROR('您已经在此俱乐部中, 无需再次加入');
        }
        else if (joinStatus.JoinStatus == 3) {
            return response_1.Response.ERROR('管理员禁止您加入, 请联系管理员加入');
        }
        this.app.rpc.club.clubRemote.updateRequire.toServer(dispatcher_1.dispatch(clubInfo.ClubKey + '', this.app.getServersByType('club')).id, clubInfo.ClubKey);
        return response_1.Response.OK('加入成功, 请等待审批');
    }
    async getClubList(msg, session) {
        let userID = parseInt(session.uid);
        let ret = await dbManager_1.DBManager.get().clubDB.getClubList(userID);
        let config = await dbManager_1.DBManager.get().systemDB.getConfig('ClubMaxUser');
        let maxCnt = -1;
        if (config && config.ConfigValue != '-1') {
            maxCnt = parseInt(config.ConfigValue);
        }
        let gameServers = this.app.getServersByType('club');
        for (let info of ret) {
            this.app.rpc.club.clubRemote.add.toServer(dispatcher_1.dispatch(info.ClubKey + '', gameServers).id, info.ClubKey, session.uid, session.get('FrontendID'));
            if (maxCnt != -1)
                info.MaxUserCnt = maxCnt;
        }
        return ret;
    }
    async enterClub(msg, session) {
        session.set('clubKey', msg.clubKey);
        session.push('clubKey', function (err) {
            if (err) {
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });
        return response_1.Response.OK('');
    }
}
exports.HallClubHandler = HallClubHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFsbENsdWJIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vYXBwL3NlcnZlcnMvaGFsbC9oYW5kbGVyL2hhbGxDbHViSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5REFBb0Q7QUFDcEQsaUVBQThEO0FBQzlELHVEQUFvRDtBQUVwRCxtQkFBeUIsR0FBZ0I7SUFDckMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRkQsNEJBRUM7QUFHRCxNQUFhLGVBQWU7SUFJeEIsWUFBb0IsR0FBZ0I7UUFBaEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUZwQyxtQkFBYyxHQUFtQixJQUFJLENBQUM7UUFHbEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQVEsRUFBRSxPQUF1QjtRQUM5QyxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLElBQUksU0FBUyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXJFLElBQUksU0FBUyxDQUFDLFFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDMUIsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQsSUFBSSxRQUFRLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEUsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUN0QixPQUFPLG1CQUFRLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFD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