import { Application, ChannelService } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { dispatch } from "../../../util/dispatcher";
import { Response } from "../../../util/response";
import { HallService } from "../service/hallService";

export default function (app: Application) {
    return new HallRemote(app);
}

export class HallRemote {

    channelService: ChannelService;

    constructor(private app: Application) {
        this.app = app;
        this.channelService = this.app.get('channelService');
    }

    public async add(uid: string, sid: string, flag: boolean) {
        let channel = this.channelService.getChannel('Hall', flag);

        if (!!channel) {
            if (!channel.getMember(uid))
                channel.add(uid, sid);
        }

        this._sendRollNotice(uid, sid);

        return true;
    }

    public async leave(uid: string, sid: string) {
        let channel = this.channelService.getChannel('Hall');
        if (!!channel) {
            channel.leave(uid, sid);
        }
    }

    private async _sendRollNotice(uid: string, sid: string) {
        this.channelService.pushMessageByUids('onRollNotice',
            await HallService.getRollNotice(), [{
                uid: uid,
                sid: sid
            }]);
    }

    public async updateUserInfo(userID: number) {
        let channel = this.channelService.getChannel('Hall');
        if (!!channel) {
            let user = channel.getMember(userID + '');
            if (user) {
                let userInfo = await DBManager.get().accountDB.getScoreInfo(userID);
                this.channelService.pushMessageByUids('onUpdateRoomCard', userInfo.RoomCard, [user]);
            }
        }
    }

    //获取客服微信
    public async getCustomerServiceWechats() {
        let wechat = await DBManager.get().systemDB.getConfig('CustomerServiceWechat');
        if (!wechat)
            return Response.ERROR('未配置客服微信。');

        let retData = wechat.ConfigValue.split('|');
        return Response.OK(retData);
    }

    //获取第三方客户链接
    public async getCustomerServiceLink() {
        let link = await DBManager.get().systemDB.getConfig('CustomerServiceLink');
        if (!link)
            return Response.ERROR('未配置客服系统链接。');

        return Response.OK({
            Link: link.ConfigValue
        });
    }

    public async addClub(userID: number, clubKey: number) {
        let user = this.channelService.getChannel('Hall').getMember(userID + '');
        if (user) {
            let clubInfo = await DBManager.get().clubDB.getClubInfoByKey(clubKey);
            clubInfo.TableCnt = await DBManager.get().clubDB.getTableCnt(clubInfo.ClubKey);
            let config = await DBManager.get().systemDB.getConfig('ClubMaxUser');
            if (config && config.ConfigValue != '-1') {
                clubInfo.MaxUserCnt = parseInt(config.ConfigValue);
            }
            await this.app.rpc.club.clubRemote.add.toServer(dispatch(clubKey + '',
                this.app.getServersByType('club')).id,
                clubKey, user.uid, user.sid);
            this.channelService.pushMessageByUids('onAddClub', clubInfo, [user]);
        }
    }

    //实名认证
    public async setRealAuth(userID: number, realName: string, passport: string) {
        let accountsInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            Response.ERROR('玩家信息获取失败。');

        if (accountsInfo.RealName && accountsInfo.RealName.length > 0 && accountsInfo.PassPortID && accountsInfo.PassPortID.length > 0)
            Response.ERROR('您已完成实名认证，无须重复操作。');

        if (!realName || realName.length == 0)
            Response.ERROR('请输入有效的真实姓名。');

        let passportPattern = /^[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0|1][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$/;

        if (!passportPattern.test(passport))
            Response.ERROR('请输入有效的身份证号。');

        let ret = await DBManager.get().accountDB.setRealAuth(userID, realName, passport);
        if (ret && ret.affectedRows > 0)
            Response.OK('认证完成。');

        return Response.ERROR('认证异常。');
    }

    //绑定推广码
    public async bindSpreader(userID: number, spreaderGameID: number, callback: Function) {
        let accountsInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            return Response.ERROR('获取玩家信息失败。');

        if (accountsInfo.SpreaderID > 0)
            return Response.ERROR('您已绑定推广员，无须重复操作。');

        let spreaderInfo = await DBManager.get().accountDB.getAccountsInfoByGameID(spreaderGameID);
        if (!spreaderInfo)
            return Response.ERROR('推广员不存在。');

        if (spreaderInfo.SpreaderID == userID)
            return Response.ERROR('禁止相互绑定。');

        let ret = await DBManager.get().accountDB.setSpreader(userID, spreaderInfo.UserID);

        let response: Response = null;
        if (ret && ret.affectedRows > 0) {
            response = Response.OK('绑定推广员成功。', {
                SpreaderID: spreaderInfo.UserID
            });

            if (typeof callback == 'function')
                return callback(response);
            return response;
        }

        response = Response.ERROR('绑定推广员异常。');

        if (typeof callback == 'function')
            callback(response);
        return response;
    }
}
