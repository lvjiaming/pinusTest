import { Application } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from "../../../util/response";

export default function (app: Application) {
    return new RechargeRemote(app);
}

export class RechargeRemote {

    constructor(private app: Application) {
        this.app = app;
    }

    public async getRechargeItems() {
        let rechargeQudaos = await DBManager.get().shopDB.getRechargeQudaos();
        if (!rechargeQudaos || rechargeQudaos.length == 0)
            return Response.ERROR('暂无可用支付通道。');

        //获取支付通道链接
        let apiDomain = await DBManager.get().systemDB.getConfig('ApiIPv4');
        let rechargeTemplateLink = 'http://'+apiDomain+'/pay/gateway/order';

        let recharegeItems = [];
        for (let qudao of rechargeQudaos) {
            let items = await DBManager.get().shopDB.getRechargeItems(qudao.QudaoID);
            if (!items || items.length == 0)
                continue;

            let qudaoItem = {
                QudaoName: qudao.QudaoName,
                QudaoType:qudao.QudaoType,//支付类型 1 微信 2 支付宝 3 银联...
                CurrencyType: qudao.CurrencyType,//货币类型 0 游戏币 1 房卡/钻石
                OrderURL:rechargeTemplateLink,
                Items: new Array()
            }

            for (let item of items) {
                qudaoItem.Items.push({
                    ID: item.ID,
                    Amount: item.Amount,
                    RechargeCount: item.RechargeCount,
                    GrantCount: item.GrantCount
                });
            }
            recharegeItems.push(qudaoItem);
        }

        if (recharegeItems.length > 0)
            return Response.OK(recharegeItems);
        return Response.ERROR('暂无可用支付通道。');
    }
}