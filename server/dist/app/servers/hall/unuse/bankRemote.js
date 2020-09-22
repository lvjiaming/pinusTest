"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankRemote = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
const security_1 = require("../../../util/security");
function default_1(app) {
    return new BankRemote(app);
}
exports.default = default_1;
class BankRemote {
    constructor(app) {
        this.app = app;
        this.app = app;
    }
    //保险箱初始化
    async bankInit(userID, insurePasswd) {
        //设置保险箱密码
        insurePasswd = security_1.Security.md5(insurePasswd);
        let ret = await dbManager_1.DBManager.get().accountDB.setInsurePasswd(userID, insurePasswd);
        if (!ret || ret.affectedRows == 0)
            return response_1.Response.ERROR('保险箱初始化异常。');
        return response_1.Response.OK('保险箱已完成初始化。');
    }
    //存入保险箱
    async tradeIn(userID, score) {
        score = Math.abs(score);
        let scoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        if (scoreInfo.Score < score)
            return response_1.Response.ERROR('携带游戏币不足。');
        let ret = await dbManager_1.DBManager.get().accountDB.addScore(userID, -score, score);
        if (!ret || ret.affectedRows == 0)
            return response_1.Response.ERROR('操作异常。');
        let afterScoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        let clientIP = '';
        //写入记录
        //tradeType 1 寸 2 取 3 转
        await dbManager_1.DBManager.get().recordDB.insertTradeRecord(0, 0, userID, scoreInfo.Score, scoreInfo.InsureScore, userID, afterScoreInfo.Score, afterScoreInfo.InsureScore, score, 0, 1, clientIP, '');
        return response_1.Response.OK('已存入保险箱' + score + '游戏币。', {
            Score: afterScoreInfo.Score,
            InsureScore: afterScoreInfo.InsureScore
        });
    }
    //从保险箱取出游戏币
    async tradeOut(userID, score, insurePass) {
        let accountsInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            return response_1.Response.ERROR('获取玩家信息失败。');
        insurePass = security_1.Security.md5(insurePass);
        if (accountsInfo.InsurePass != insurePass)
            return response_1.Response.ERROR('保险箱密码不正确。');
        score = Math.abs(score);
        let scoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        if (scoreInfo.InsureScore < score)
            return response_1.Response.ERROR('保险箱游戏币不足。');
        let ret = await dbManager_1.DBManager.get().accountDB.addScore(userID, score, -score);
        if (!ret || ret.affectedRows == 0)
            return response_1.Response.ERROR('操作异常。');
        let afterScoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        let clientIP = '';
        //写入记录
        //tradeType 1 寸 2 取 3 转
        await dbManager_1.DBManager.get().recordDB.insertTradeRecord(0, 0, userID, scoreInfo.Score, scoreInfo.InsureScore, userID, afterScoreInfo.Score, afterScoreInfo.InsureScore, score, 0, 2, clientIP, '');
        return response_1.Response.OK('已从保险箱取出' + score + '游戏币。', {
            Score: afterScoreInfo.Score,
            InsureScore: afterScoreInfo.InsureScore
        });
    }
    //从保险箱内转账
    async transferFromInsure(userID, dstGameID, score, insurePass) {
        let accountsInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            return response_1.Response.ERROR('获取玩家信息失败。');
        insurePass = security_1.Security.md5(insurePass);
        if (accountsInfo.InsurePass != insurePass)
            return response_1.Response.ERROR('保险箱密码不正确。');
        score = Math.abs(score);
        let scoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        if (scoreInfo.InsureScore < score)
            return response_1.Response.ERROR('保险箱游戏币不足。');
        let transferRatio = await dbManager_1.DBManager.get().systemDB.getConfig('TransferRatio');
        transferRatio = !transferRatio ? 0 : transferRatio.ConfigValue;
        let serviceAmount = score * (transferRatio * 1.0 / 100);
        if (scoreInfo.InsureScore < (score + serviceAmount))
            return response_1.Response.ERROR('保险箱游戏币不足[服务费：' + serviceAmount + ']');
        let destAccontsInfo = await dbManager_1.DBManager.get().accountDB.getAccountsInfoByGameID(dstGameID);
        if (!destAccontsInfo)
            return response_1.Response.ERROR('目标玩家不存在。');
        let ret = await dbManager_1.DBManager.get().accountDB.transferFromInsure(userID, destAccontsInfo.UserID, score);
        if (!ret || ret.affectedRows == 0)
            return response_1.Response.ERROR('操作异常。');
        //扣除源玩家转账手续费
        if (serviceAmount > 0)
            await dbManager_1.DBManager.get().accountDB.addScore(userID, 0, -serviceAmount);
        let afterScoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(destAccontsInfo.UserID);
        let clientIP = '';
        //写入记录
        //tradeType 1 寸 2 取 3 转
        await dbManager_1.DBManager.get().recordDB.insertTradeRecord(0, 0, userID, scoreInfo.Score, scoreInfo.InsureScore, destAccontsInfo.UserID, afterScoreInfo.Score, afterScoreInfo.InsureScore, score, serviceAmount, 3, clientIP, '');
        //获取源玩家余额
        afterScoreInfo = await dbManager_1.DBManager.get().accountDB.getScoreInfo(userID);
        return response_1.Response.OK('转账成功。', {
            Score: afterScoreInfo.Score,
            InsureScore: afterScoreInfo.InsureScore
        });
    }
}
exports.BankRemote = BankRemote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFua1JlbW90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2FwcC9zZXJ2ZXJzL2hhbGwvdW51c2UvYmFua1JlbW90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwrREFBNEQ7QUFDNUQscURBQWtEO0FBQ2xELHFEQUFrRDtBQUVsRCxtQkFBeUIsR0FBZ0I7SUFDckMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBRkQsNEJBRUM7QUFFRCxNQUFhLFVBQVU7SUFFbkIsWUFBb0IsR0FBZ0I7UUFBaEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUNoQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsUUFBUTtJQUNELEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBYyxFQUFFLFlBQW9CO1FBQ3RELFNBQVM7UUFDVCxZQUFZLEdBQUcsbUJBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUMsSUFBSSxHQUFHLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hGLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksSUFBSSxDQUFDO1lBQzdCLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkMsT0FBTyxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsT0FBTztJQUNBLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBYyxFQUFFLEtBQWE7UUFDOUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsSUFBSSxTQUFTLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckUsSUFBSSxTQUFTLENBQUMsS0FBSyxHQUFHLEtBQUs7WUFDdkIsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV0QyxJQUFJLEdBQUcsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsWUFBWSxJQUFJLENBQUM7WUFDN0IsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVuQyxJQUFJLGNBQWMsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUxRSxJQUFJLFFBQVEsR0FBVyxFQUFFLENBQUM7UUFDMUIsTUFBTTtRQUNOLHVCQUF1QjtRQUN2QixNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLFdBQVcsRUFDakcsTUFBTSxFQUFFLGNBQWMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFekYsT0FBTyxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsS0FBSyxHQUFHLE1BQU0sRUFBRTtZQUMxQyxLQUFLLEVBQUUsY0FBYyxDQUFDLEtBQUs7WUFDM0IsV0FBVyxFQUFFLGNBQWMsQ0FBQyxXQUFXO1NBQzFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxXQUFXO0lBQ0osS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFjLEVBQUUsS0FBYSxFQUFFLFVBQWtCO1FBQ25FLElBQUksWUFBWSxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLFlBQVk7WUFDYixPQUFPLG1CQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXZDLFVBQVUsR0FBRyxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0QyxJQUFJLFlBQVksQ0FBQyxVQUFVLElBQUksVUFBVTtZQUNyQyxPQUFPLG1CQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXZDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLElBQUksU0FBUyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JFLElBQUksU0FBUyxDQUFDLFdBQVcsR0FBRyxLQUFLO1lBQzdCLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFdkMsSUFBSSxHQUFHLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksSUFBSSxDQUFDO1lBQzdCLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbkMsSUFBSSxjQUFjLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFMUUsSUFBSSxRQUFRLEdBQVcsRUFBRSxDQUFDO1FBQzFCLE1BQU07UUFDTix1QkFBdUI7UUFDdkIsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQ2pHLE1BQU0sRUFBRSxjQUFjLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXpGLE9BQU8sbUJBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLEtBQUssR0FBRyxNQUFNLEVBQUU7WUFDM0MsS0FBSyxFQUFFLGNBQWMsQ0FBQyxLQUFLO1lBQzNCLFdBQVcsRUFBRSxjQUFjLENBQUMsV0FBVztTQUMxQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsU0FBUztJQUNGLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFjLEVBQUUsU0FBaUIsRUFBRSxLQUFhLEVBQUUsVUFBa0I7UUFDaEcsSUFBSSxZQUFZLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRixJQUFJLENBQUMsWUFBWTtZQUNiLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFdkMsVUFBVSxHQUFHLG1CQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RDLElBQUksWUFBWSxDQUFDLFVBQVUsSUFBSSxVQUFVO1lBQ3JDLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFdkMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsSUFBSSxTQUFTLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckUsSUFBSSxTQUFTLENBQUMsV0FBVyxHQUFHLEtBQUs7WUFDN0IsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUV2QyxJQUFJLGFBQWEsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM5RSxhQUFhLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztRQUUvRCxJQUFJLGFBQWEsR0FBVyxLQUFLLEdBQUcsQ0FBQyxhQUFhLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2hFLElBQUksU0FBUyxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUM7WUFDL0MsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsYUFBYSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBRWpFLElBQUksZUFBZSxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekYsSUFBSSxDQUFDLGVBQWU7WUFDaEIsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUV0QyxJQUFJLEdBQUcsR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BHLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksSUFBSSxDQUFDO1lBQzdCLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbkMsWUFBWTtRQUNaLElBQUksYUFBYSxHQUFHLENBQUM7WUFDakIsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXhFLElBQUksY0FBYyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUxRixJQUFJLFFBQVEsR0FBVyxFQUFFLENBQUM7UUFDMUIsTUFBTTtRQUNOLHVCQUF1QjtRQUN2QixNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLFdBQVcsRUFDakcsZUFBZSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXJILFNBQVM7UUFDVCxjQUFjLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEUsT0FBTyxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDeEIsS0FBSyxFQUFFLGNBQWMsQ0FBQyxLQUFLO1lBQzNCLFdBQVcsRUFBRSxjQUFjLENBQUMsV0FBVztTQUMxQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUEzSEQsZ0NBMkhDIn0=