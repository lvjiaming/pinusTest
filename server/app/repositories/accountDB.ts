import { ip } from './../../config/config';
import { Database } from "./database";
import { DBManager } from "./dbManager";

export class AccountDB extends Database {

    constructor() {
        super();
    }

    public async callRegAccounts(acc: string, psw: string, ip: string) {
        let res = await this.query('set @ret =\'\';call reg_accounts(?, ?, ?,@ret);select @ret as ret;', [acc, psw, ip]);
        return res[res.length - 1][0].ret;
    }

    public async callLoginAccounts(acc: string, psw: string, ip: string) {
        let res = await this.query('set @ret =\'\';call login_accounts(?, ?, ?,@ret);select @ret as ret;', [acc, psw, ip]);
        res = this.filterOKPacket(res);
        return res;
    }

    public async callReg3rd(platformID: number, unionID: string, name: string, gender: number, headImg: string, ip: string) {
        let res = await this.query('set @ret =\'\';call reg_3rd(?,?,?,?,?,?,@ret);select @ret as ret;',
            [platformID, unionID, name, gender, headImg, ip]);
        res = this.filterOKPacket(res);
        return res[res.length - 1].ret;
    }

    public async getAccountsInfoByPlatformID(id: string) {
        let ret = await this.query('select * from accounts_info where UserUin = ?', [id]);
        return ret[ret.length - 1] || null;
    }

    public async getAccountsInfoByUserID(userID: number) {
        let ret = await this.query('select * from accounts_info where UserID = ?', [userID]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }

    public async getAccountsInfoByGameID(gameID: number) {
        let ret = await this.query('select * from accounts_info where GameID = ?', [gameID]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }

    public async setInsurePasswd(userID: number, insurePasswd: string) {
        let ret = await this.query('update accounts_info set InsurePass = ? where UserID = ?;', [insurePasswd, userID]);
        return ret;
    }

    public async getScoreInfo(userID: number) {
        let sql: string = 'select * from accounts_score_info where UserID = ? for update;';
        let ret = await this.query(sql, [userID]);
        if (!ret || ret.length == 0) {
            await this.query('insert into accounts_score_info (UserID) values(?)', [userID]);
            ret = await this.query(sql, [userID]);
        }
        return ret[0];
    }

    public async addScore(userID: number, addScore: number, addInsureScore: any) {
        let sql = 'update accounts_score_info set Score = Score+?,InsureScore=InsureScore+? where UserID = ? and (Score+?)>=0 and (InsureScore+?)>=0 ';
        let ret = await this.query(sql, [addScore, addInsureScore, userID, addScore, addInsureScore]);
        return ret;
    }

    public async addRoomCard(userID: number, add: number) {
        let sql = 'update accounts_score_info set RoomCard = RoomCard+? where UserID = ?';
        let ret = await this.query(sql, [add, userID]);
        return ret;
    }

    public async addRoomCardAndRecord(userID: number, add: number) {
        await DBManager.get().recordDB.insertChangeCurrency(userID, add, 1, 1, 'Server', ip, '');
        return await this.addRoomCard(userID, add);
    }

    public async transferFromInsure(userID: number, dstUserID: number, score: number) {
        let sql = 'start TRANSACTION;\n' +
            'update accounts_score_info set InsureScore = InsureScore -? where UserID = ?;\n' +
            'update accounts_score_info set InsureScore = InsureScore +? WHERE UserID = ?;\n' +
            'COMMIT;';
        let ret = await this.query(sql, [score, userID, score, dstUserID]);
        return ret;
    }

    public async transfer(userID: number, dstUserID: number, score: number) {
        let sql = 'start TRANSACTION;\n' +
            'update accounts_score_info set Score = Score -? where UserID = ?;\n' +
            'update accounts_score_info set Score = Score +? WHERE UserID = ?;\n' +
            'COMMIT;';
        let ret = await this.query(sql, [score, userID, score, dstUserID]);
        return ret;
    }

    public async setRealAuth(userID: number, realName: string, passport: string) {
        let sql = 'update accounts_info set PassPortID=?,RealName=? where UserID = ?;';
        let ret = await this.query(sql, [passport, realName, userID]);
        return ret;
    }

    public async setSpreader(userID: number, spreaderID: any) {
        let sql = 'update accounts_info set SpreaderID = ? where UserID = ?;';
        let ret = await this.query(sql, [spreaderID, userID]);
        return ret;
    }
}