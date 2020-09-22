import { Application, BackendSession, ChannelService } from 'pinus';
import { dispatch } from '../../../util/dispatcher';
import { DBManager } from './../../../repositories/dbManager';
import { Response } from './../../../util/response';

export default function (app: Application) {
    return new HallClubHandler(app);
}


export class HallClubHandler {

    channelService: ChannelService = null;

    constructor(private app: Application) {
        this.channelService = this.app.get('channelService');
    }

    async createClub(msg: any, session: BackendSession) {
        let userID = parseInt(session.uid);
        let userScore = await DBManager.get().accountDB.getScoreInfo(userID);

        if (userScore.RoomCard < 100) {
            return Response.ERROR('您必须拥有100张房卡以上才能创建俱乐部!');
        }

        let clubList = await DBManager.get().clubDB.getClubList(userID);
        if (clubList.length >= 5) {
            return Response.ERROR('俱乐部数量超过上限!');
        }

        let clubInfo = await DBManager.get().clubDB.createClub(userID, msg.name);
        clubInfo.TableCnt = await DBManager.get().clubDB.getTableCnt(clubInfo.ClubKey);
        let config = await DBManager.get().systemDB.getConfig('ClubMaxUser');
        if (config && config.ConfigValue != '-1') {
            clubInfo.MaxUserCnt = parseInt(config.ConfigValue);
        }

        await this.app.rpc.club.clubRemote.add.toServer(dispatch(clubInfo.ClubKey + '',
            this.app.getServersByType('club')).id,
            clubInfo.ClubKey, session.uid, session.get('FrontendID'));
        this.channelService.pushMessageByUids('onAddClub',
            clubInfo, [{
                uid: session.uid,
                sid: session.get('FrontendID')
            }]);
        return Response.OK(`俱乐部创建成功,ID:${clubInfo.ClubID}`);
    }

    async joinClub(msg: { clubID: number }, session: BackendSession) {
        let userID = parseInt(session.uid);
        let clubInfo = await DBManager.get().clubDB.getClubInfo(msg.clubID);
        if (!clubInfo) {
            return Response.ERROR('俱乐部不存在!');
        }
        let joinStatus = await DBManager.get().clubDB.getJoinStatus(userID, clubInfo.ClubKey);
        if (joinStatus == null) {
            await DBManager.get().clubDB.joinClub(userID, clubInfo.ClubKey);
        } else if (joinStatus.JoinStatus == 2) {
            await DBManager.get().clubDB.updateJoinStatus(userID, clubInfo.ClubKey, 0);
        } else if (joinStatus.JoinStatus == 0) {
            return Response.ERROR('您已经申请过了, 请耐心等待管理员同意');
        } else if (joinStatus.JoinStatus == 1) {
            return Response.ERROR('您已经在此俱乐部中, 无需再次加入');
        } else if (joinStatus.JoinStatus == 3) {
            return Response.ERROR('管理员禁止您加入, 请联系管理员加入');
        }

        this.app.rpc.club.clubRemote.updateRequire.toServer(dispatch(clubInfo.ClubKey+'', this.app.getServersByType('club')).id, clubInfo.ClubKey);

        return Response.OK('加入成功, 请等待审批');
    }


    async getClubList(msg: any, session: BackendSession) {
        let userID = parseInt(session.uid);
        let ret = await DBManager.get().clubDB.getClubList(userID);
        let config = await DBManager.get().systemDB.getConfig('ClubMaxUser');
        let maxCnt = -1;
        if (config && config.ConfigValue != '-1') {
            maxCnt = parseInt(config.ConfigValue);
        }
        let gameServers = this.app.getServersByType('club');
        for (let info of ret) {
            this.app.rpc.club.clubRemote.add.toServer(dispatch(info.ClubKey + '', gameServers).id,
                info.ClubKey, session.uid, session.get('FrontendID'));
            if (maxCnt != -1) info.MaxUserCnt = maxCnt;
        }
        return ret;
    }

    async enterClub(msg: { clubKey: number }, session: BackendSession) {
        session.set('clubKey', msg.clubKey);
        session.push('clubKey', function (err) {
            if (err) {
                console.error('set rid for session service failed! error is : %j', err.stack);
            }
        });
        return Response.OK('');
    }
}
