import { Database } from "./database";
import { DBManager } from './dbManager';

export class RecordDB extends Database {

    constructor() {
        super();
    }

    //tradeType 1 寸 2 取 3 转
    public async insertTradeRecord(kindID: number, serverID: number, sourceUserID: number, sourceScore: number, sourceInsureScore: number
        , targetUserID: number, targetScore: number, targetInsureScore: number
        , swapScore: number, revenue: number, tradeType: number, clientIP: string, collectNote: string) {
        let sql = 'insert into records_swap_score(KindID,ServerID,SourceUserID,SourceScore,SourceInsureScore,TargetUserID,TargetScore,TargetInsureScore,SwapScore,Revenue,TradeType,ClientIP,CollectDate,CollectNote)\n' +
            'values(?,?,?,?,?,?,?,?,?,?,?,?,?,?);';

        let ret = await this.query(sql, [kindID, serverID, sourceUserID, sourceScore, sourceInsureScore
            , targetUserID, targetScore, targetInsureScore
            , swapScore, revenue, tradeType, clientIP, new Date(), collectNote]);
        return ret;
    }

    public async insertChangeCurrency(userID: number, add: number, type: number, state: number,
        changer: string, changerIP: string, remark: string) {
        let userScore = await DBManager.get().accountDB.getScoreInfo(userID);
        if (!userScore) {
            console.log('insertChangeCurrency err user not exist ' + userID);
            return null;
        }
        let before = type ? userScore.RoomCard: userScore.Score;
        let sql = 'insert into records_change_currency (UserID, BeforeCount, ChangeCount, ChangeType, \
            ChangeStatus, Changer, ChangerIP, Remark, CreateTime) \
            values (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())';
        let ret = await this.query(sql, [userID, before, add, type, state, changer, changerIP, remark]);
        return ret.length > 0;
    }

    public async getTodayShareAdd(userID: number) {
        let sql = 'select * from records_change_currency where UserID = ? and DATEDIFF(NOW(), CreateTime) = 0';
        let ret = await this.query(sql, [userID]);
        return ret;
    }
}