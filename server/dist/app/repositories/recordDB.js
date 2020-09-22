"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordDB = void 0;
const database_1 = require("./database");
const dbManager_1 = require("./dbManager");
class RecordDB extends database_1.Database {
    constructor() {
        super();
    }
    //tradeType 1 寸 2 取 3 转
    async insertTradeRecord(kindID, serverID, sourceUserID, sourceScore, sourceInsureScore, targetUserID, targetScore, targetInsureScore, swapScore, revenue, tradeType, clientIP, collectNote) {
        let sql = 'insert into records_swap_score(KindID,ServerID,SourceUserID,SourceScore,SourceInsureScore,TargetUserID,TargetScore,TargetInsureScore,SwapScore,Revenue,TradeType,ClientIP,CollectDate,CollectNote)\n' +
            'values(?,?,?,?,?,?,?,?,?,?,?,?,?,?);';
        let ret = await this.query(sql, [kindID, serverID, sourceUserID, sourceScore, sourceInsureScore,
            targetUserID, targetScore, targetInsureScore,
            swapScore, revenue, tradeType, clientIP, new Date(), collectNote]);
        return ret;
    }
    async insertChangeCurrency(userID, add, type, state, changer, changerIP, remark) {
        let userScore = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        if (!userScore) {
            console.log('insertChangeCurrency err user not exist ' + userID);
            return null;
        }
        let before = type ? userScore.RoomCard : userScore.Score;
        let sql = 'insert into records_change_currency (UserID, BeforeCount, ChangeCount, ChangeType, \
            ChangeStatus, Changer, ChangerIP, Remark, CreateTime) \
            values (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())';
        let ret = await this.query(sql, [userID, before, add, type, state, changer, changerIP, remark]);
        return ret.length > 0;
    }
    async getTodayShareAdd(userID) {
        let sql = 'select * from records_change_currency where UserID = ? and DATEDIFF(NOW(), CreateTime) = 0';
        let ret = await this.query(sql, [userID]);
        return ret;
    }
}
exports.RecordDB = RecordDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkREIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvcmVwb3NpdG9yaWVzL3JlY29yZERCLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlDQUFzQztBQUN0QywyQ0FBd0M7QUFFeEMsTUFBYSxRQUFTLFNBQVEsbUJBQVE7SUFFbEM7UUFDSSxLQUFLLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCx1QkFBdUI7SUFDaEIsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxRQUFnQixFQUFFLFlBQW9CLEVBQUUsV0FBbUIsRUFBRSxpQkFBeUIsRUFDL0gsWUFBb0IsRUFBRSxXQUFtQixFQUFFLGlCQUF5QixFQUNwRSxTQUFpQixFQUFFLE9BQWUsRUFBRSxTQUFpQixFQUFFLFFBQWdCLEVBQUUsV0FBbUI7UUFDOUYsSUFBSSxHQUFHLEdBQUcsc01BQXNNO1lBQzVNLHNDQUFzQyxDQUFDO1FBRTNDLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsaUJBQWlCO1lBQ3pGLFlBQVksRUFBRSxXQUFXLEVBQUUsaUJBQWlCO1lBQzVDLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDekUsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRU0sS0FBSyxDQUFDLG9CQUFvQixDQUFDLE1BQWMsRUFBRSxHQUFXLEVBQUUsSUFBWSxFQUFFLEtBQWEsRUFDdEYsT0FBZSxFQUFFLFNBQWlCLEVBQUUsTUFBYztRQUNsRCxJQUFJLFNBQVMsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsR0FBRyxNQUFNLENBQUMsQ0FBQztZQUNqRSxPQUFPLElBQUksQ0FBQztTQUNmO1FBQ0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQ3hELElBQUksR0FBRyxHQUFHOztpRUFFK0MsQ0FBQztRQUMxRCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDaEcsT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRU0sS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQWM7UUFDeEMsSUFBSSxHQUFHLEdBQUcsNEZBQTRGLENBQUM7UUFDdkcsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0NBQ0o7QUF2Q0QsNEJBdUNDIn0=