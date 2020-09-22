"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeRemote = void 0;
const dbManager_1 = require("../../../repositories/dbManager");
const response_1 = require("../../../util/response");
function default_1(app) {
    return new NoticeRemote(app);
}
exports.default = default_1;
class NoticeRemote {
    constructor(app) {
        this.app = app;
        this.app = app;
    }
    //获取滚动公告
    async getRollNotice() {
        let notices = await dbManager_1.DBManager.get().systemDB.getNotice(0);
        if (!notices || notices.length == 0)
            return response_1.Response.ERROR('暂无滚动公告内容。');
        return response_1.Response.OK({
            Content: notices[0].NoticeContent
        });
    }
    //获取手机公告
    async getMobileNotices() {
        let notices = await dbManager_1.DBManager.get().systemDB.getNotice(1);
        if (!notices || notices.length == 0)
            return response_1.Response.ERROR('暂无手机公告。');
        let ret = [];
        for (let notice of notices) {
            ret.push({
                Subject: notice.NoticeTitle,
                Content: notice.NoticeContent,
                PublishTime: notice.PublishTime,
            });
        }
        return response_1.Response.OK(ret);
    }
    //获取图片活动公告
    async getActivityNotices() {
        let notices = await dbManager_1.DBManager.get().systemDB.getNotice(2);
        if (!notices || notices.length == 0)
            return response_1.Response.ERROR('暂无活动公告。');
        let config = await dbManager_1.DBManager.get().systemDB.getConfig('ImageDomain');
        let imageDomain = !config ? '' : (config.ConfigValue);
        let ret = [];
        for (let notice of notices) {
            ret.push({
                Subject: notice.NoticeTitle,
                Content: notice.NoticeContent,
                Image: imageDomain + notice.NoticeImage,
                PublishTime: notice.PublishTime,
            });
        }
        return response_1.Response.OK(ret);
    }
}
exports.NoticeRemote = NoticeRemote;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWNlUmVtb3RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vYXBwL3NlcnZlcnMvaGFsbC91bnVzZS9ub3RpY2VSZW1vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsK0RBQTREO0FBQzVELHFEQUFrRDtBQUVsRCxtQkFBeUIsR0FBZ0I7SUFDckMsT0FBTyxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRkQsNEJBRUM7QUFFRCxNQUFhLFlBQVk7SUFFckIsWUFBb0IsR0FBZ0I7UUFBaEIsUUFBRyxHQUFILEdBQUcsQ0FBYTtRQUNoQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRUQsUUFBUTtJQUNELEtBQUssQ0FBQyxhQUFhO1FBQ3RCLElBQUksT0FBTyxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQy9CLE9BQU8sbUJBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFdkMsT0FBTyxtQkFBUSxDQUFDLEVBQUUsQ0FBQztZQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYTtTQUNwQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsUUFBUTtJQUNELEtBQUssQ0FBQyxnQkFBZ0I7UUFDekIsSUFBSSxPQUFPLEdBQUcsTUFBTSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFFLENBQUM7WUFDN0IsT0FBTyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDYixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBQztZQUN2QixHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNMLE9BQU8sRUFBQyxNQUFNLENBQUMsV0FBVztnQkFDMUIsT0FBTyxFQUFDLE1BQU0sQ0FBQyxhQUFhO2dCQUM1QixXQUFXLEVBQUMsTUFBTSxDQUFDLFdBQVc7YUFDakMsQ0FBQyxDQUFDO1NBQ047UUFDRCxPQUFPLG1CQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxVQUFVO0lBQ0gsS0FBSyxDQUFDLGtCQUFrQjtRQUMzQixJQUFJLE9BQU8sR0FBRyxNQUFNLHFCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxJQUFHLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUUsQ0FBQztZQUM1QixPQUFPLG1CQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXJDLElBQUksTUFBTSxHQUFHLE1BQU0scUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JFLElBQUksV0FBVyxHQUFVLENBQUMsTUFBTSxDQUFBLENBQUMsQ0FBQSxFQUFFLENBQUEsQ0FBQyxDQUFBLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNiLEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ0wsT0FBTyxFQUFDLE1BQU0sQ0FBQyxXQUFXO2dCQUMxQixPQUFPLEVBQUMsTUFBTSxDQUFDLGFBQWE7Z0JBQzVCLEtBQUssRUFBQyxXQUFXLEdBQUMsTUFBTSxDQUFDLFdBQVc7Z0JBQ3BDLFdBQVcsRUFBQyxNQUFNLENBQUMsV0FBVzthQUNqQyxDQUFDLENBQUM7U0FDTjtRQUNELE9BQU8sbUJBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNKO0FBcERELG9DQW9EQyJ9