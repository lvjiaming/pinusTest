import {Database} from "./database";

export class ShopDB extends Database{

    constructor () {
        super();
    }

    public async getRechargeQudaos(){
        let sql = 'select * from system_recharge_qudao where Nullity =0;';
        let ret = await this.query(sql,[]);
        return ret;
    }

    public async getRechargeItems(qudaoID:number){
        let sql = 'select * from system_recharge_config where QudaoID = ? and Nullity =0';
        let ret = await this.query(sql,[qudaoID]);
        return ret;
    }
}