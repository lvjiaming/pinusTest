import { Application, BackendSession, ChannelService } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from "../../../util/response";
import { HallService } from '../service/hallService';
import { ip } from './../../../../config/config';

export default function (app: Application) {
    return new HallHandler(app);
}

export class HallHandler {

    channelService: ChannelService;

    constructor(private app: Application) {
        this.channelService = this.app.get('channelService');
    }


    public async enter(msg: any, session: BackendSession) {
        let channel = this.channelService.getChannel('Hall', true);
        let uid = session.uid, sid = session.get('FrontendID');
        if (!!channel) {
            if (!channel.getMember(uid))
                channel.add(uid, sid);
        }

        this._sendRollNotice(uid, sid);

        let scoreInfo = await DBManager.get().accountDB.getScoreInfo(parseInt(uid));

        return Response.OK({
            RoomCard: scoreInfo.RoomCard
        });
    }

    private async _sendRollNotice(uid: string, sid: string) {
        this.channelService.pushMessageByUids('onRollNotice',
            await HallService.getRollNotice(), [{
                uid: uid,
                sid: sid
            }]);
    }

    //获取客服微信
    async getKfWechats(session: BackendSession) {
        let wechat = await DBManager.get().systemDB.getConfig('CustomerServiceWechat');
        if (!wechat)
            return Response.ERROR('未配置客服微信。');

        let retData = wechat.ConfigValue.split('|');
        return Response.OK(retData);
    }

    async getGameRecord(msg: any, session: BackendSession) {
        let userID = parseInt(session.uid);
        let ret = await DBManager.get().gameDB.getDrawInfo(userID);
        return HallService.getGameRecord(ret);
    }

    async getGameRecordDetail(msg: { serviceID: number }, session: BackendSession) {
        let ret = await DBManager.get().gameDB.getDrawScore(msg.serviceID);
        let drawID: number[] = [];
        ret.forEach((row: any) => drawID.push(row.DrawID));
        let scoreInfo = await DBManager.get().gameDB.getDrawScoreUser(drawID);
        let user: any = {};
        scoreInfo.forEach((row: any) => {
            if (!user[row.DrawID]) {
                user[row.DrawID] = [];
            }
            user[row.DrawID].push({
                userID: row.UserID,
                score: row.Score
            });
        });
        ret.forEach((row: any) => {
            row.user = user[row.DrawID];
            if (row.StartTime) {
                row.StartTime = row.StartTime.fmt('yyyy-MM-dd hh:mm:ss');
            }
        });
        return Response.OK(ret);
    }

    // 分享赠送
    async shareGive(msg: any, session: BackendSession) {
        let userID = parseInt(session.uid);
        let ret = await DBManager.get().recordDB.getTodayShareAdd(userID);
        if (ret && ret.length > 0) {
            return Response.ERROR('今日已经赠送房卡了');
        } else {
            let config = await DBManager.get().systemDB.getConfig('ShareGive');
            if (config && config.ConfigValue != '-1') {
                let add = parseInt(config.ConfigValue);
                await DBManager.get().recordDB.insertChangeCurrency(userID, add, 1, 8, 'Server', ip, '');
                await DBManager.get().accountDB.addRoomCard(userID, add);
                this.app.rpc.hall.hallRemote.updateUserInfo.route(session, true)(userID);
                return Response.OK('获得系统赠送');
            }
        }
    }

    async getReplayALL(msg: any, session: BackendSession) {
        let serviceID = await DBManager.get().gameDB.getServiceIDByDrawID(msg.drawID);
        if (!serviceID) {
            return Response.ERROR('战绩回放已失效');
        }
        let res = await DBManager.get().gameDB.getDrawVideo(msg.drawID);
        if (res == null) {
            return Response.ERROR('战绩回放已失效');
        }
        let ret = await DBManager.get().gameDB.getDrawIDByServiceID(serviceID);
        if (ret == null || ret.length == 0) {
            return Response.ERROR('战绩回放已失效');
        }
        let arr: any[] = [];
        ret.forEach((info: any) => arr.push(info.DrawID));
        let str: string = res.GameData
        do {
            let newStr = str.slice(0, 1024);
            str = str.slice(1024);
            this.channelService.pushMessageByUids('onReplayDataDetail', newStr, [{
                uid: session.uid,
                sid: session.get('FrontendID')
            }]);
        } while (str != '')
        let data = {
            curDrawID: res.DrawID,
            drawIDs: arr,
        };
        this.channelService.pushMessageByUids('onReplayDataDetail', Response.OK(data), [{
            uid: session.uid,
            sid: session.get('FrontendID')
        }]);
        return true;
    }

    async getReplay(msg: any, session: BackendSession) {
        let ret = await DBManager.get().gameDB.getDrawVideo(msg.drawID);
        if (ret == null) {
            this.channelService.pushMessageByUids('onReplayData', Response.ERROR('战绩回放已失效'), [{
                uid: session.uid,
                sid: session.get('FrontendID')
            }]);
        } else {
            let str: string = ret.GameData
            do {
                let newStr = str.slice(0, 1024);
                str = str.slice(1024);
                this.channelService.pushMessageByUids('onReplayData', newStr, [{
                    uid: session.uid,
                    sid: session.get('FrontendID')
                }]);
            } while (str != '')
            this.channelService.pushMessageByUids('onReplayData', Response.OK({ drawID: msg.drawID }), [{
                uid: session.uid,
                sid: session.get('FrontendID')
            }]);
        }
        return true;
    }

    //获取充值信息
    async getRechargeItems(session: BackendSession) {
        let rechargeItems = await this.app.rpc.hall.rechargeRemote.getRechargeItems.route(session)();
        console.log(JSON.stringify(rechargeItems));
        return rechargeItems;
    }

    //获取滚动公告
    async getRollNotice(session: BackendSession) {
        let ret = this.app.rpc.hall.noticeRemote.getRollNotice.route(session)();
        console.log(ret);
        return ret;
    }

    //获取手机公告
    async getMobileNotices(session: BackendSession) {
        let notices = this.app.rpc.hall.noticeRemote.getMobileNotices.route(session)();
        return notices;
    }

    //获取图片活动公告
    async getActNotices(session: BackendSession) {
        let actNotices = this.app.rpc.hall.noticeRemote.getActivityNotices.route(session)();
        return actNotices;
    }

    //获取第三方客服平台链接
    async getKfLink(session: BackendSession) {
        // let customerServiceLink = this.app.rpc.hall.hallRemote.getCustomerServiceLink.route(session)();
        // return customerServiceLink;
    }

    //绑定推广员
    async bindSpreader(msg: any, session: BackendSession) {
        // let bindRet = await this.app.rpc.hall.hallRemote.bindSpreader.route(session)(msg.uid, msg.sgid, (ret: Response) => {
        //TODO do something...
        // });
        // return bindRet;
    }
}