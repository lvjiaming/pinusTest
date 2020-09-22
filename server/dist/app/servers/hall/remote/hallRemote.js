"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallRemote = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const dispatcher_1 = require("../../../util/dispatcher");
const response_1 = require("../../../util/response");
const hallService_1 = require("../service/hallService");
function default_1(app) {
    return new HallRemote(app);
}
exports.default = default_1;
class HallRemote {
    constructor(app) {
        this.app = app;
        this.app = app;
        this.channelService = this.app.get('channelService');
    }
    async add(uid, sid, flag) {
        let channel = this.channelService.getChannel('Hall', flag);
        if (!!channel) {
            if (!channel.getMember(uid))
                channel.add(uid, sid);
        }
        this._sendRollNotice(uid, sid);
        return true;
    }
    async leave(uid, sid) {
        let channel = this.channelService.getChannel('Hall');
        if (!!channel) {
            channel.leave(uid, sid);
        }
    }
    async _sendRollNotice(uid, sid) {
        this.channelService.pushMessageByUids('onRollNotice', await hallService_1.HallService.getRollNotice(), [{
                uid: uid,
                sid: sid
            }]);
    }
    async updateUserInfo(userID) {
        let channel = this.channelService.getChannel('Hall');
        if (!!channel) {
            let user = channel.getMember(userID + '');
            if (user) {
                let userInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
                this.channelService.pushMessageByUids('onUpdateRoomCard', userInfo.RoomCard, [user]);
            }
        }
    }
    //获取客服微信
    async getCustomerServiceWechats() {
        let wechat = await dbManager_1.DBManager.get().systemDB.getConfig('CustomerServiceWechat');
        if (!wechat)
            return response_1.Response.ERROR('未配置客服微信。');
        let retData = wechat.ConfigValue.split('|');
        return response_1.Response.OK(retData);
    }
    //获取第三方客户链接
    async getCustomerServiceLink() {
        let link = await dbManager_1.DBManager.get().systemDB.getConfig('CustomerServiceLink');
        if (!link)
            return response_1.Response.ERROR('未配置客服系统链接。');
        return response_1.Response.OK({
            Link: link.ConfigValue
        });
    }
    async addClub(userID, clubKey) {
        let user = this.channelService.getChannel('Hall').getMember(userID + '');
        if (user) {
            let clubInfo = await dbManager_1.DBManager.get().clubDB.getClubInfoByKey(clubKey);
            clubInfo.TableCnt = await dbManager_1.DBManager.get().clubDB.getTableCnt(clubInfo.ClubKey);
            let config = await dbManager_1.DBManager.get().systemDB.getConfig('ClubMaxUser');
            if (config && config.ConfigValue != '-1') {
                clubInfo.MaxUserCnt = parseInt(config.ConfigValue);
            }
            await this.app.rpc.club.clubRemote.add.toServer(dispatcher_1.dispatch(clubKey + '', this.app.getServersByType('club')).id, clubKey, user.uid, user.sid);
            this.channelService.pushMessageByUids('onAddClub', clubInfo, [user]);
        }
    }
    //实名认证
    async setRealAuth(userID, realName, passport) {
        let accountsInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            response_1.Response.ERROR('玩家信息获取失败。');
        if (accountsInfo.RealName && accountsInfo.RealName.length > 0 && accountsInfo.PassPortID && accountsInfo.PassPortID.length > 0)
            response_1.Response.ERROR('您已完成实名认证，无须重复操作。');
        if (!realName || realName.length == 0)
            response_1.Response.ERROR('请输入有效的真实姓名。');
        let passportPattern = /^[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0|1][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$/;
        if (!passportPattern.test(passport))
            response_1.Response.ERROR('请输入有效的身份证号。');
        let ret = await dbManager_1.DBManager.get().accountDB.setRealAuth(userID, realName, passport);
        if (ret && ret.affectedRows > 0)
            response_1.Response.OK('认证完成。');
        return response_1.Response.ERROR('认证异常。');
    }
    //绑定推广码
    async bindSpreader(userID, spreaderGameID, callback) {
        let accountsInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            return response_1.Response.ERROR('获取玩家信息失败。');
        if (accountsInfo.SpreaderID > 0)
            return response_1.Response.ERROR('您已绑定推广员，无须重复操作。');
        let spreaderInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByGameID(spreaderGameID);
        if (!spreaderInfo)
            return response_1.Response.ERROR('推广员不存在。');
        if (spreaderInfo.SpreaderID == userID)
            return response_1.Response.ERROR('禁止相互绑定。');
        let ret = await dbManager_1.DBManager.get().accountDB.setSpreader(userID, spreaderInfo.UserID);
        let response = null;
        if (ret && ret.affectedRows > 0) {
            response = response_1.Response.OK('绑定推广员成功。', {
                SpreaderID: spreaderInfo.UserID
            });
            if (typeof callback == 'function')
                return callback(response);
            return response;
        }
        response = response_1.Response.ERROR('绑定推广员异常。');
        if (typeof callback == 'function')
            callback(response);
        return response;
    }
}
exports.HallRemote = HallRemote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFsbFJlbW90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2FwcC9zZXJ2ZXJzL2hhbGwvcmVtb3RlL2hhbGxSZW1vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0RBQTREO0FBQzVELHlEQUFvRDtBQUNwRCxxREFBa0Q7QUFDbEQsd0RBQXFEO0FBRXJELG1CQUF5QixHQUFnQjtJQUNyQyxPQUFPLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFGRCw0QkFFQztBQUVELE1BQWEsVUFBVTtJQUluQixZQUFvQixHQUFnQjtRQUFoQixRQUFHLEdBQUgsR0FBRyxDQUFhO1FBQ2hDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsSUFBYTtRQUNwRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFM0QsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFO1lBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM3QjtRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRS9CLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQ3ZDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxD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