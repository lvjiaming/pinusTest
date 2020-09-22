"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallHandler = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
const hallService_1 = require("../service/hallService");
const config_1 = require("./../../../../config/config");
function default_1(app) {
    return new HallHandler(app);
}
exports.default = default_1;
class HallHandler {
    constructor(app) {
        this.app = app;
        this.channelService = this.app.get('channelService');
    }
    async enter(msg, session) {
        let channel = this.channelService.getChannel('Hall', true);
        let uid = session.uid, sid = session.get('FrontendID');
        if (!!channel) {
            if (!channel.getMember(uid))
                channel.add(uid, sid);
        }
        this._sendRollNotice(uid, sid);
        let scoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(parseInt(uid));
        return response_1.Response.OK({
            RoomCard: scoreInfo.RoomCard
        });
    }
    async _sendRollNotice(uid, sid) {
        this.channelService.pushMessageByUids('onRollNotice', await hallService_1.HallService.getRollNotice(), [{
                uid: uid,
                sid: sid
            }]);
    }
    //获取客服微信
    async getKfWechats(session) {
        let wechat = await dbManager_1.DBManager.get().systemDB.getConfig('CustomerServiceWechat');
        if (!wechat)
            return response_1.Response.ERROR('未配置客服微信。');
        let retData = wechat.ConfigValue.split('|');
        return response_1.Response.OK(retData);
    }
    async getGameRecord(msg, session) {
        let userID = parseInt(session.uid);
        let ret = await dbManager_1.DBManager.get().gameDB.getDrawInfo(userID);
        return hallService_1.HallService.getGameRecord(ret);
    }
    async getGameRecordDetail(msg, session) {
        let ret = await dbManager_1.DBManager.get().gameDB.getDrawScore(msg.serviceID);
        let drawID = [];
        ret.forEach((row) => drawID.push(row.DrawID));
        let scoreInfo = await dbManager_1.DBManager.get().gameDB.getDrawScoreUser(drawID);
        let user = {};
        scoreInfo.forEach((row) => {
            if (!user[row.DrawID]) {
                user[row.DrawID] = [];
            }
            user[row.DrawID].push({
                userID: row.UserID,
                score: row.Score
            });
        });
        ret.forEach((row) => {
            row.user = user[row.DrawID];
            if (row.StartTime) {
                row.StartTime = row.StartTime.fmt('yyyy-MM-dd hh:mm:ss');
            }
        });
        return response_1.Response.OK(ret);
    }
    // 分享赠送
    async shareGive(msg, session) {
        let userID = parseInt(session.uid);
        let ret = await dbManager_1.DBManager.get().recordDB.getTodayShareAdd(userID);
        if (ret && ret.length > 0) {
            return response_1.Response.ERROR('今日已经赠送房卡了');
        }
        else {
            let config = await dbManager_1.DBManager.get().systemDB.getConfig('ShareGive');
            if (config && config.ConfigValue != '-1') {
                let add = parseInt(config.ConfigValue);
                await dbManager_1.DBManager.get().recordDB.insertChangeCurrency(userID, add, 1, 8, 'Server', config_1.ip, '');
                await dbManager_1.DBManager.get().accountDB.addRoomCard(userID, add);
                this.app.rpc.hall.hallRemote.updateUserInfo.route(session, true)(userID);
                return response_1.Response.OK('获得系统赠送');
            }
        }
    }
    async getReplayALL(msg, session) {
        let serviceID = await dbManager_1.DBManager.get().gameDB.getServiceIDByDrawID(msg.drawID);
        if (!serviceID) {
            return response_1.Response.ERROR('战绩回放已失效');
        }
        let res = await dbManager_1.DBManager.get().gameDB.getDrawVideo(msg.drawID);
        if (res == null) {
            return response_1.Response.ERROR('战绩回放已失效');
        }
        let ret = await dbManager_1.DBManager.get().gameDB.getDrawIDByServiceID(serviceID);
        if (ret == null || ret.length == 0) {
            return response_1.Response.ERROR('战绩回放已失效');
        }
        let arr = [];
        ret.forEach((info) => arr.push(info.DrawID));
        let str = res.GameData;
        do {
            let newStr = str.slice(0, 1024);
            str = str.slice(1024);
            this.channelService.pushMessageByUids('onReplayDataDetail', newStr, [{
                    uid: session.uid,
                    sid: session.get('FrontendID')
                }]);
        } while (str != '');
        let data = {
            curDrawID: res.DrawID,
            drawIDs: arr,
        };
        this.channelService.pushMessageByUids('onReplayDataDetail', response_1.Response.OK(data), [{
                uid: session.uid,
                sid: session.get('FrontendID')
            }]);
        return true;
    }
    async getReplay(msg, session) {
        let ret = await dbManager_1.DBManager.get().gameDB.getDrawVideo(msg.drawID);
        if (ret == null) {
            this.channelService.pushMessageByUids('onReplayData', response_1.Response.ERROR('战绩回放已失效'), [{
                    uid: session.uid,
                    sid: session.get('FrontendID')
                }]);
        }
        else {
            let str = ret.GameData;
            do {
                let newStr = str.slice(0, 1024);
                str = str.slice(1024);
                this.channelService.pushMessageByUids('onReplayData', newStr, [{
                        uid: session.uid,
                        sid: session.get('FrontendID')
                    }]);
            } while (str != '');
            this.channelService.pushMessageByUids('onReplayData', response_1.Response.OK({ drawID: msg.drawID }), [{
                    uid: session.uid,
                    sid: session.get('FrontendID')
                }]);
        }
        return true;
    }
    //获取充值信息
    async getRechargeItems(session) {
        let rechargeItems = await this.app.rpc.hall.rechargeRemote.getRechargeItems.route(session)();
        console.log(JSON.stringify(rechargeItems));
        return rechargeItems;
    }
    //获取滚动公告
    async getRollNotice(session) {
        let ret = this.app.rpc.hall.noticeRemote.getRollNotice.route(session)();
        console.log(ret);
        return ret;
    }
    //获取手机公告
    async getMobileNotices(session) {
        let notices = this.app.rpc.hall.noticeRemote.getMobileNotices.route(session)();
        return notices;
    }
    //获取图片活动公告
    async getActNotices(session) {
        let actNotices = this.app.rpc.hall.noticeRemote.getActivityNotices.route(session)();
        return actNotices;
    }
    //获取第三方客服平台链接
    async getKfLink(session) {
        // let customerServiceLink = this.app.rpc.hall.hallRemote.getCustomerServiceLink.route(session)();
        // return customerServiceLink;
    }
    //绑定推广员
    async bindSpreader(msg, session) {
        // let bindRet = await this.app.rpc.hall.hallRemote.bindSpreader.route(session)(msg.uid, msg.sgid, (ret: Response) => {
        //TODO do something...
        // });
        // return bindRet;
    }
}
exports.HallHandler = HallHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFsbEhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9oYWxsL2hhbmRsZXIvaGFsbEhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0RBQTREO0FBQzVELHFEQUFrRDtBQUNsRCx3REFBcUQ7QUFDckQsd0RBQWlEO0FBRWpELG1CQUF5QixHQUFnQjtJQUNyQyxPQUFPLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFGRCw0QkFFQztBQUVELE1BQWEsV0FBVztJQUlwQixZQUFvQixHQUFnQjtRQUFoQixRQUFHLEdBQUgsR0FBRyxDQUFhO1FBQ2hDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBR00sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFRLEVBQUUsT0FBdUI7UUFDaEQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFO1lBQ1gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM3QjtRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRS9CLElBQUksU0FBUyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENB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