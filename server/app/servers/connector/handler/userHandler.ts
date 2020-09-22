import { Application, FrontendSession } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from '../../../util/response';

export default function (app: Application) {
    return new UserHandler(app);
}

interface IBaseInfo {
    UserID: number;
    GameID: number;
    NickName: string;
    FaceURL: string;
    ip: string;
}

export class UserHandler {
    constructor(private app: Application) {
    }

    private async user(msg: { uid: number }, session: FrontendSession) {
        let res = await DBManager.get().accountDB.getAccountsInfoByUserID(msg.uid);
        if (res == null) {
            return Response.ERROR('查无此人');
        }
        let base: IBaseInfo = {
            UserID: res.UserID,
            GameID: res.GameID,
            NickName: encodeURI(res.NickName),
            FaceURL: res.FaceURL,
            ip: res.LastLogonIP
        };
        return Response.OK(base);
    }
}