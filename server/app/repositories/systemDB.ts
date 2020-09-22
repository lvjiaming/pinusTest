import {Database} from "./database";

export class SystemDB extends Database{

    constructor () {
        super();
    }

    //noticeType 公告类型 0 大厅滚动公告 1 手机公告 2 活动公告
    public async getNotice(noticeType:number){
        let sql = 'select * from system_notices where NoticeType = ? and OnPublish = 1 order by OnTop,SortID;';
        let ret = await this.query(sql,[noticeType]);
        return ret;
    }

    public async getConfig(configName:string){
        let sql = 'select * from system_config_info where ConfigName = ?';
        let ret = await this.query(sql,[configName]);
        if(!ret || ret.length==0)
            return null;
        return ret[0];
    }
}