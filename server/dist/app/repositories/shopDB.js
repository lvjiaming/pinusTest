"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopDB = void 0;
const database_1 = require("./database");
class ShopDB extends database_1.Database {
    constructor() {
        super();
    }
    async getRechargeQudaos() {
        let sql = 'select * from system_recharge_qudao where Nullity =0;';
        let ret = await this.query(sql, []);
        return ret;
    }
    async getRechargeItems(qudaoID) {
        let sql = 'select * from system_recharge_config where QudaoID = ? and Nullity =0';
        let ret = await this.query(sql, [qudaoID]);
        return ret;
    }
}
exports.ShopDB = ShopDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hvcERCLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYXBwL3JlcG9zaXRvcmllcy9zaG9wREIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUNBQW9DO0FBRXBDLE1BQWEsTUFBTyxTQUFRLG1CQUFRO0lBRWhDO1FBQ0ksS0FBSyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRU0sS0FBSyxDQUFDLGlCQUFpQjtRQUMxQixJQUFJLEdBQUcsR0FBRyx1REFBdUQsQ0FBQztRQUNsRSxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVNLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFjO1FBQ3hDLElBQUksR0FBRyxHQUFHLHVFQUF1RSxDQUFDO1FBQ2xGLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztDQUNKO0FBakJELHdCQWlCQyJ9