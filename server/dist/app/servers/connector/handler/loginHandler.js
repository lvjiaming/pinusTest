"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHandler = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
const httpClient_1 = require("../../../web/httpClient");
const config_1 = require("./../../../../config/config");
function default_1(app) {
    return new LoginHandler(app);
}
exports.default = default_1;
class LoginHandler {
    constructor(app) {
        this.app = app;
    }
    async getLoginLink(data, session) {
        let ret = await dbManager_1.DBManager.get().systemDB.getConfig('LoginLink');
        if (!ret)
            return response_1.Response.ERROR('服务器域名未设置!');
        else
            return response_1.Response.OK({ link: ret.ConfigValue });
    }
    async loginGuest(msg, session) {
    }
    async registAccount(msg, session) {
        let res = await dbManager_1.DBManager.get().accountDB.callRegAccounts(msg.acc, msg.psw, session.remoteAddress.ip.slice(7));
        if (!res || res.length == 0)
            return response_1.Response.OK('注册成功!');
        return response_1.Response.ERROR(res);
    }
    async loginAccount(msg, session) {
        let res = await dbManager_1.DBManager.get().accountDB.callLoginAccounts(msg.acc, msg.psw, session.remoteAddress.ip.slice(7));
        let desc = res[1] ? res[1][0].ret : res[0].ret;
        let user = res[0][0];
        if (desc) {
            return response_1.Response.ERROR(desc);
        }
        return this._login(user, session);
    }
    async loginWeChat(msg, session) {
        msg.name = decodeURI(msg.name);
        let res = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByPlatformID(msg.unionid);
        if (!res) {
            res = await dbManager_1.DBManager.get().accountDB.callReg3rd(1, msg.unionid, msg.name, msg.sex == '男' ? 1 : 2, msg.headimgurl, session.remoteAddress.ip.slice(7));
            if (res) {
                return response_1.Response.ERROR(res);
            }
            res = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByPlatformID(msg.unionid);
        }
        return this._login(res, session);
    }
    async loginWXH5(msg, session) {
        let url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
        let ret = await httpClient_1.HttpClient.get(url, {
            appid: config_1.WXID,
            secret: config_1.WXSECRET,
            code: msg.code,
            grant_type: 'authorization_code'
        });
        if (ret.err || !ret.data) {
            return response_1.Response.ERROR('获取token失败!');
        }
        let data = ret.data;
        if (data.errcode) {
            return response_1.Response.ERROR(data.errmsg);
        }
        url = 'https://api.weixin.qq.com/sns/userinfo';
        let res = await httpClient_1.HttpClient.get(url, {
            access_token: data.access_token,
            openid: data.openid,
            lang: 'zh_CN'
        });
        if (res.err || !res.data) {
            return response_1.Response.ERROR('获取用户信息失败!');
        }
        data = res.data;
        if (data.errcode) {
            return response_1.Response.ERROR(data.errmsg);
        }
        data.name = data.nickname;
        return this.loginWeChat(data, session);
    }
    async _login(user, session) {
        let scoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(user.UserID);
        let userInfo = {
            UserID: user.UserID,
            GameID: user.GameID,
            AgentID: user.AgentID,
            Gender: user.Gender,
            MemberOrder: user.MemberOrder,
            SpreaderID: user.SpreaderID,
            Score: scoreInfo.Score,
            InsureScore: scoreInfo.InsureScore,
            RoomCard: scoreInfo.RoomCard,
            NickName: encodeURI(user.NickName),
            Accounts: user.Accounts,
            FaceURL: user.FaceURL,
            LogonPass: user.LogonPass,
            SessionSecret: user.SessionSecret,
        };
        return this.enter(userInfo, session);
    }
    async enter(userInfo, session) {
        let self = this;
        let uid = userInfo.UserID + '';
        let sessionService = self.app.get('sessionService');
        // duplicate log in
        if (!!sessionService.getByUid(uid)) {
            // sessionService.sendMessageByUid(uid, 'onKick');
            sessionService.kick(uid, 'kick');
            // return Response.ERROR('您的账号正在其他地方登陆!');
        }
        await session.abind(uid);
        session.on('closed', this.onUserLeave.bind(this));
        session.set('FrontendID', this.app.get('serverId'));
        session.push('FrontendID', function (err) {
            if (err) {
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });
        let roomIn = await dbManager_1.DBManager.get().gameDB.getInRoom(userInfo.UserID);
        if (roomIn) {
            let roomInfo = await dbManager_1.DBManager.get().gameDB.getRoomInfo(roomIn.ServerID);
            if (!roomInfo) {
                roomIn = null;
            }
            else {
                session.set('ServerID', roomInfo.ServerID);
                session.push('ServerID', function (err) {
                    if (err) {
                        console.error('set rid for session service failed! error is : %j', err.stack);
                    }
                });
            }
        }
        return response_1.Response.OK({
            userInfo: userInfo,
            roomInfo: roomIn ? {
                RoomID: roomIn.ServerID,
                KindID: roomIn.KindID
            } : null
        });
    }
    async onUserLeave(session) {
        let userID = parseInt(session.uid);
        if (!session || !session.uid) {
            return;
        }
        if (session.get('ServerID')) {
            let roomIn = await dbManager_1.DBManager.get().gameDB.getInRoom(userID);
            if (roomIn) {
                let roomInfo = await dbManager_1.DBManager.get().gameDB.getRoomInfo(roomIn.ServerID);
                if (roomInfo) {
                    this.app.rpc.game.gameRemote.userOffline.route(session, true)(userID, roomInfo.RoomID);
                }
            }
        }
        if (session.get('FrontendID')) {
            this.app.rpc.hall.hallRemote.leave.route(session, true)(session.uid, session.get('FrontendID'));
        }
        if (session.get('ClubKey')) {
            this.app.rpc.club.clubRemote.leave.route(session, true)(session.uid, session.get('FrontendID'), session.get('ClubKey'));
        }
    }
}
exports.LoginHandler = LoginHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW5IYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vYXBwL3NlcnZlcnMvY29ubmVjdG9yL2hhbmRsZXIvbG9naW5IYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLCtEQUE0RDtBQUM1RCxxREFBa0Q7QUFDbEQsd0RBQXFEO0FBQ3JELHdEQUE2RDtBQUc3RCxtQkFBeUIsR0FBZ0I7SUFDckMsT0FBTyxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRkQsNEJBRUM7QUFFRCxNQUFhLFlBQVk7SUFDckIsWUFBb0IsR0FBZ0I7UUFBaEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtJQUVwQyxDQUFDO0lBRU0sS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFTLEVBQUUsT0FBd0I7UUFDekQsSUFBSSxHQUFHLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLEdBQUc7WUFBRSxPQUFPLG1CQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztZQUN4QyxPQUFPLG1CQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFTyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQVEsRUFBRSxPQUF3QjtJQUUzRCxDQUFDO0lBRU8sS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFRLEVBQUUsT0FBd0I7UUFDMUQsSUFBSSxHQUFHLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FB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