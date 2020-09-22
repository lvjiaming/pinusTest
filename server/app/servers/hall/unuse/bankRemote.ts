import { Application, ChannelService, FrontendSession, RemoterClass } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from "../../../util/response";
import { Security } from "../../../util/security";

export default function (app: Application) {
    return new BankRemote(app);
}

export class BankRemote {

    constructor(private app: Application) {
        this.app = app;
    }

    //保险箱初始化
    public async bankInit(userID: number, insurePasswd: string) {
        //设置保险箱密码
        insurePasswd = Security.md5(insurePasswd);
        let ret = await DBManager.get().accountDB.setInsurePasswd(userID, insurePasswd);
        if (!ret || ret.affectedRows == 0)
            return Response.ERROR('保险箱初始化异常。');
        return Response.OK('保险箱已完成初始化。');
    }

    //存入保险箱
    public async tradeIn(userID: number, score: number) {
        score = Math.abs(score);
        let scoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);
        if (scoreInfo.Score < score)
            return Response.ERROR('携带游戏币不足。');

        let ret = await DBManager.get().accountDB.addScore(userID, -score, score);
        if (!ret || ret.affectedRows == 0)
            return Response.ERROR('操作异常。');

        let afterScoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);

        let clientIP: string = '';
        //写入记录
        //tradeType 1 寸 2 取 3 转
        await DBManager.get().recordDB.insertTradeRecord(0, 0, userID, scoreInfo.Score, scoreInfo.InsureScore,
            userID, afterScoreInfo.Score, afterScoreInfo.InsureScore, score, 0, 1, clientIP, '');

        return Response.OK('已存入保险箱' + score + '游戏币。', {
            Score: afterScoreInfo.Score,
            InsureScore: afterScoreInfo.InsureScore
        });
    }

    //从保险箱取出游戏币
    public async tradeOut(userID: number, score: number, insurePass: string) {
        let accountsInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            return Response.ERROR('获取玩家信息失败。');

        insurePass = Security.md5(insurePass);
        if (accountsInfo.InsurePass != insurePass)
            return Response.ERROR('保险箱密码不正确。');

        score = Math.abs(score);
        let scoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);
        if (scoreInfo.InsureScore < score)
            return Response.ERROR('保险箱游戏币不足。');

        let ret = await DBManager.get().accountDB.addScore(userID, score, -score);
        if (!ret || ret.affectedRows == 0)
            return Response.ERROR('操作异常。');

        let afterScoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);

        let clientIP: string = '';
        //写入记录
        //tradeType 1 寸 2 取 3 转
        await DBManager.get().recordDB.insertTradeRecord(0, 0, userID, scoreInfo.Score, scoreInfo.InsureScore,
            userID, afterScoreInfo.Score, afterScoreInfo.InsureScore, score, 0, 2, clientIP, '');

        return Response.OK('已从保险箱取出' + score + '游戏币。', {
            Score: afterScoreInfo.Score,
            InsureScore: afterScoreInfo.InsureScore
        });
    }

    //从保险箱内转账
    public async transferFromInsure(userID: number, dstGameID: number, score: number, insurePass: string) {
        let accountsInfo = await DBManager.get().accountDB.getAccountsInfoByUserID(userID);
        if (!accountsInfo)
            return Response.ERROR('获取玩家信息失败。');

        insurePass = Security.md5(insurePass);
        if (accountsInfo.InsurePass != insurePass)
            return Response.ERROR('保险箱密码不正确。');

        score = Math.abs(score);
        let scoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);
        if (scoreInfo.InsureScore < score)
            return Response.ERROR('保险箱游戏币不足。');

        let transferRatio = await DBManager.get().systemDB.getConfig('TransferRatio');
        transferRatio = !transferRatio ? 0 : transferRatio.ConfigValue;

        let serviceAmount: number = score * (transferRatio * 1.0 / 100);
        if (scoreInfo.InsureScore < (score + serviceAmount))
            return Response.ERROR('保险箱游戏币不足[服务费：' + serviceAmount + ']');

        let destAccontsInfo = await DBManager.get().accountDB.getAccountsInfoByGameID(dstGameID);
        if (!destAccontsInfo)
            return Response.ERROR('目标玩家不存在。');

        let ret = await DBManager.get().accountDB.transferFromInsure(userID, destAccontsInfo.UserID, score);
        if (!ret || ret.affectedRows == 0)
            return Response.ERROR('操作异常。');

        //扣除源玩家转账手续费
        if (serviceAmount > 0)
            await DBManager.get().accountDB.addScore(userID, 0, -serviceAmount);

        let afterScoreInfo = await DBManager.get().accountDB.getScoreInfo(destAccontsInfo.UserID);

        let clientIP: string = '';
        //写入记录
        //tradeType 1 寸 2 取 3 转
        await DBManager.get().recordDB.insertTradeRecord(0, 0, userID, scoreInfo.Score, scoreInfo.InsureScore,
            destAccontsInfo.UserID, afterScoreInfo.Score, afterScoreInfo.InsureScore, score, serviceAmount, 3, clientIP, '');

        //获取源玩家余额
        afterScoreInfo = await DBManager.get().accountDB.getScoreInfo(userID);
        return Response.OK('转账成功。', {
            Score: afterScoreInfo.Score,
            InsureScore: afterScoreInfo.InsureScore
        });
    }
}