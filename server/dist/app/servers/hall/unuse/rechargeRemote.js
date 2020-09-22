"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RechargeRemote = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
function default_1(app) {
    return new RechargeRemote(app);
}
exports.default = default_1;
class RechargeRemote {
    constructor(app) {
        this.app = app;
        this.app = app;
    }
    async getRechargeItems() {
        let rechargeQudaos = await dbManager_1.DBManager.get().shopDB.getRechargeQudaos();
        if (!rechargeQudaos || rechargeQudaos.length == 0)
            return response_1.Response.ERROR('暂无可用支付通道。');
        //获取支付通道链接
        let apiDomain = await dbManager_1.DBManager.get().systemDB.getConfig('ApiIPv4');
        let rechargeTemplateLink = 'http://' + apiDomain + '/pay/gateway/order';
        let recharegeItems = [];
        for (let qudao of rechargeQudaos) {
            let items = await dbManager_1.DBManager.get().shopDB.getRechargeItems(qudao.QudaoID);
            if (!items || items.length == 0)
                continue;
            let qudaoItem = {
                QudaoName: qudao.QudaoName,
                QudaoType: qudao.QudaoType,
                CurrencyType: qudao.CurrencyType,
                OrderURL: rechargeTemplateLink,
                Items: new Array()
            };
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
            return response_1.Response.OK(recharegeItems);
        return response_1.Response.ERROR('暂无可用支付通道。');
    }
}
exports.RechargeRemote = RechargeRemote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjaGFyZ2VSZW1vdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9hcHAvc2VydmVycy9oYWxsL3VudXNlL3JlY2hhcmdlUmVtb3RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLCtEQUE0RDtBQUM1RCxxREFBa0Q7QUFFbEQsbUJBQXlCLEdBQWdCO0lBQ3JDLE9BQU8sSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUZELDRCQUVDO0FBRUQsTUFBYSxjQUFjO0lBRXZCLFlBQW9CLEdBQWdCO1FBQWhCLFFBQUcsR0FBSCxHQUFHLENBQWE7UUFDaEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVNLEtBQUssQ0FBQyxnQkFBZ0I7UUFDekIsSUFBSSxjQUFjLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3RFLElBQUksQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQzdDLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFdkMsVUFBVTtRQUNWLElBQUksU0FBUyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BFLElBQUksb0JBQW9CLEdBQUcsU0FBUyxHQUFDLFNBQVMsR0FBQyxvQkFBb0IsQ0FBQztRQUVwRSxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7UUFDeEIsS0FBSyxJQUFJLEtBQUssSUFBSSxjQUFjLEVBQUU7WUFDOUIsSUFBSSxLQUFLLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQzNCLFNBQVM7WUFFYixJQUFJLFNBQVMsR0FBRztnQkFDWixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQzFCLFNBQVMsRUFBQyxLQUFLLENBQUMsU0FBUztnQkFDekIsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZO2dCQUNoQyxRQUFRLEVBQUMsb0JBQW9CO2dCQUM3QixLQUFLLEVBQUUsSUFBSSxLQUFLLEVBQUU7YUFDckIsQ0FBQTtZQUVELEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO2dCQUNwQixTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDakIsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO29CQUNYLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtvQkFDbkIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO29CQUNqQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7aUJBQzlCLENBQUMsQ0FBQzthQUNOO1lBQ0QsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNsQztRQUVELElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ3pCLE9BQU8sbUJBQVEsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdkMsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0o7QUE1Q0Qsd0NBNENDIn0=