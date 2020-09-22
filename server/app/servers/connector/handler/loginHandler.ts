import { Application, FrontendSession } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from '../../../util/response';
import { HttpClient } from '../../../web/httpClient';
import { WXID, WXSECRET } from './../../../../config/config';


export default function (app: Application) {
    return new LoginHandler(app);
}

export class LoginHandler {
    constructor(private app: Application) {

    }

    public async getLoginLink(data: any, session: FrontendSession) {
        let ret = await DBManager.get().systemDB.getConfig('LoginLink');
        if (!ret) return Response.ERROR('服务器域名未设置!');
        else return Response.OK({ link: ret.ConfigValue });
    }

    private async loginGuest(msg: any, session: FrontendSession) {

    }

    private async registAccount(msg: any, session: FrontendSession) {
        let res = await DBManager.get().accountDB.callRegAccounts(msg.acc, msg.psw, session.remoteAddress.ip.slice(7));
        if (!res || res.length == 0)
            return Response.OK('注册成功!');
        return Response.ERROR(res);
    }

    private async loginAccount(msg: { acc: string, psw: string }, session: FrontendSession) {
        let res = await DBManager.get().accountDB.callLoginAccounts(msg.acc, msg.psw, session.remoteAddress.ip.slice(7));
        let desc: string = res[1] ? res[1][0].ret : res[0].ret;
        let user: any = res[0][0];

        if (desc) {
            return Response.ERROR(desc);
        }

        return this._login(user, session);
    }

    private async loginWeChat(msg: { unionid: string, openid: string, sex: string, headimgurl: string, name: string }, session: FrontendSession) {
        msg.name = decodeURI(msg.name);
        let res = await DBManager.get().accountDB.getAccountsInfoByPlatformID(msg.unionid);
        if (!res) {
            res = await DBManager.get().accountDB.callReg3rd(1, msg.unionid, msg.name,
                msg.sex == '男' ? 1 : 2, msg.headimgurl, session.remoteAddress.ip.slice(7));
            if (res) {
                return Response.ERROR(res);
            }
            res = await DBManager.get().accountDB.getAccountsInfoByPlatformID(msg.unionid);
        }
        return this._login(res, session);
    }

    private async loginWXH5(msg: { code: string }, session: FrontendSession) {
        let url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
        let ret = await HttpClient.get(url, {
            appid: WXID,
            secret: WXSECRET,
            code: msg.code,
            grant_type: 'authorization_code'
        });
        if (ret.err || !ret.data) {
            return Response.ERROR('获取token失败!');
        }
        let data = ret.data;
        if (data.errcode) {
            return Response.ERROR(data.errmsg)
        }
        url = 'https://api.weixin.qq.com/sns/userinfo';
        let res = await HttpClient.get(url, {
            access_token: data.access_token,
            openid: data.openid,
            lang: 'zh_CN'
        });
        if (res.err || !res.data) {
            return Response.ERROR('获取用户信息失败!');
        }
        data = res.data;
        if (data.errcode) {
            return Response.ERROR(data.errmsg)
        }
        data.name = data.nickname;
        return this.loginWeChat(data, session);
    }

    private async _login(user: any, session: FrontendSession) {
        let scoreInfo = await DBManager.get().accountDB.getScoreInfo(user.UserID);

        let userInfo: IUserInfo = {
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

    private async enter(userInfo: IUserInfo, session: FrontendSession) {
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

        let roomIn = await DBManager.get().gameDB.getInRoom(userInfo.UserID);
        if (roomIn) {
            let roomInfo = await DBManager.get().gameDB.getRoomInfo(roomIn.ServerID);
            if (!roomInfo) {
                roomIn = null;
            } else {
                session.set('ServerID', roomInfo.ServerID);
                session.push('ServerID', function (err) {
                    if (err) {
                        console.error('set rid for session service failed! error is : %j', err.stack);
                    }
                });
            }
        }

        return Response.OK({
            userInfo: userInfo,
            roomInfo: roomIn ? ({
                RoomID: roomIn.ServerID,
                KindID: roomIn.KindID
            } as IRoomBaseInfo) : null
        });
    }

    private async onUserLeave(session: FrontendSession) {
        let userID = parseInt(session.uid);
        if (!session || !session.uid) {
            return;
        }
        if (session.get('ServerID')) {
            let roomIn = await DBManager.get().gameDB.getInRoom(userID);
            if (roomIn) {
                let roomInfo = await DBManager.get().gameDB.getRoomInfo(roomIn.ServerID);
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