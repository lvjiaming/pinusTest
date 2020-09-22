"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemDB = void 0;
const database_1 = require("./database");
class SystemDB extends database_1.Database {
    constructor() {
        super();
    }
    //noticeType 公告类型 0 大厅滚动公告 1 手机公告 2 活动公告
    async getNotice(noticeType) {
        let sql = 'select * from system_notices where NoticeType = ? and OnPublish = 1 order by OnTop,SortID;';
        let ret = await this.query(sql, [noticeType]);
        return ret;
    }
    async getConfig(configName) {
        let sql = 'select * from system_config_info where ConfigName = ?';
        let ret = await this.query(sql, [configName]);
        if (!ret || ret.length == 0)
            return null;
        return ret[0];
    }
}
exports.SystemDB = SystemDB;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3lzdGVtREIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9hcHAvcmVwb3NpdG9yaWVzL3N5c3RlbURCLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlDQUFvQztBQUVwQyxNQUFhLFFBQVMsU0FBUSxtQkFBUTtJQUVsQztRQUNJLEtBQUssRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELHdDQUF3QztJQUNqQyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQWlCO1FBQ3BDLElBQUksR0FBRyxHQUFHLDRGQUE0RixDQUFDO1FBQ3ZHLElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVNLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBaUI7UUFDcEMsSUFBSSxHQUFHLEdBQUcsdURBQXVELENBQUM7UUFDbEUsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsSUFBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFFLENBQUM7WUFDcEIsT0FBTyxJQUFJLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztDQUNKO0FBcEJELDRCQW9CQyJ9