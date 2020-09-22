"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountDB = void 0;
const config_1 = require("./../../config/config");
const database_1 = require("./database");
const dbManager_1 = require("./dbManager");
class AccountDB extends database_1.Database {
    constructor() {
        super();
    }
    async callRegAccounts(acc, psw, ip) {
        let res = await this.query('set @ret =\'\';call reg_accounts(?, ?, ?,@ret);select @ret as ret;', [acc, psw, ip]);
        return res[res.length - 1][0].ret;
    }
    async callLoginAccounts(acc, psw, ip) {
        let res = await this.query('set @ret =\'\';call login_accounts(?, ?, ?,@ret);select @ret as ret;', [acc, psw, ip]);
        res = this.filterOKPacket(res);
        return res;
    }
    async callReg3rd(platformID, unionID, name, gender, headImg, ip) {
        let res = await this.query('set @ret =\'\';call reg_3rd(?,?,?,?,?,?,@ret);select @ret as ret;', [platformID, unionID, name, gender, headImg, ip]);
        res = this.filterOKPacket(res);
        return res[res.length - 1].ret;
    }
    async getAccountsInfoByPlatformID(id) {
        let ret = await this.query('select * from accounts_info where UserUin = ?', [id]);
        return ret[ret.length - 1] || null;
    }
    async getAccountsInfoByUserID(userID) {
        let ret = await this.query('select * from accounts_info where UserID = ?', [userID]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }
    async getAccountsInfoByGameID(gameID) {
        let ret = await this.query('select * from accounts_info where GameID = ?', [gameID]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }
    async setInsurePasswd(userID, insurePasswd) {
        let ret = await this.query('update accounts_info set InsurePass = ? where UserID = ?;', [insurePasswd, userID]);
        return ret;
    }
    async getScoreInfo(userID) {
        let sql = 'select * from accounts_score_info where UserID = ? for update;';
        let ret = await this.query(sql, [userID]);
        if (!ret || ret.length == 0) {
            await this.query('insert into accounts_score_info (UserID) values(?)', [userID]);
            ret = await this.query(sql, [userID]);
        }
        return ret[0];
    }
    async addScore(userID, addScore, addInsureScore) {
        let sql = 'update accounts_score_info set Score = Score+?,InsureScore=InsureScore+? where UserID = ? and (Score+?)>=0 and (InsureScore+?)>=0 ';
        let ret = await this.query(sql, [addScore, addInsureScore, userID, addScore, addInsureScore]);
        return ret;
    }
    async addRoomCard(userID, add) {
        let sql = 'update accounts_score_info set RoomCard = RoomCard+? where UserID = ?';
        let ret = await this.query(sql, [add, userID]);
        return ret;
    }
    async addRoomCardAndRecord(userID, add) {
        await dbManager_1.DBManager.get().recordDB.insertChangeCurrency(userID, add, 1, 1, 'Server', config_1.ip, '');
        return await this.addRoomCard(userID, add);
    }
    async transferFromInsure(userID, dstUserID, score) {
        let sql = 'start TRANSACTION;\n' +
            'update accounts_score_info set InsureScore = InsureScore -? where UserID = ?;\n' +
            'update accounts_score_info set InsureScore = InsureScore +? WHERE UserID = ?;\n' +
            'COMMIT;';
        let ret = await this.query(sql, [score, userID, score, dstUserID]);
        return ret;
    }
    async transfer(userID, dstUserID, score) {
        let sql = 'start TRANSACTION;\n' +
            'update accounts_score_info set Score = Score -? where UserID = ?;\n' +
            'update accounts_score_info set Score = Score +? WHERE UserID = ?;\n' +
            'COMMIT;';
        let ret = await this.query(sql, [score, userID, score, dstUserID]);
        return ret;
    }
    async setRealAuth(userID, realName, passport) {
        let sql = 'update accounts_info set PassPortID=?,RealName=? where UserID = ?;';
        let ret = await this.query(sql, [passport, realName, userID]);
        return ret;
    }
    async setSpreader(userID, spreaderID) {
        let sql = 'update accounts_info set SpreaderID = ? where UserID = ?;';
        let ret = await this.query(sql, [spreaderID, userID]);
        return ret;
    }
}
exports.AccountDB = AccountDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjb3VudERCLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYXBwL3JlcG9zaXRvcmllcy9hY2NvdW50REIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQTJDO0FBQzNDLHlDQUFzQztBQUN0QywyQ0FBd0M7QUFFeEMsTUFBYSxTQUFVLFNBQVEsbUJBQVE7SUFFbkM7UUFDSSxLQUFLLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTSxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsRUFBVTtRQUM3RCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsb0VBQW9FLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakgsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDdEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQVU7UUFDL0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLHNFQUFzRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25ILEdBQUcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVNLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBa0IsRUFBRSxPQUFlLEVBQUUsSUFBWSxFQUFFLE1BQWMsRUFBRSxPQUFlLEVBQUUsRUFBVTtRQUNsSCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsbUVBQW1FLEVBQzFGLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9B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