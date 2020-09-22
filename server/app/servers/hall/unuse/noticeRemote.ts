import { Application, ChannelService, FrontendSession, RemoterClass } from 'pinus';
import { DBManager } from '../../../repositories/dbManager';
import { Response } from "../../../util/response";

export default function (app: Application) {
    return new NoticeRemote(app);
}

export class NoticeRemote {

    constructor(private app: Application) {
        this.app = app;
    }

    //获取滚动公告
    public async getRollNotice() {
        let notices = await DBManager.get().systemDB.getNotice(0);
        if (!notices || notices.length == 0)
            return Response.ERROR('暂无滚动公告内容。');

        return Response.OK({
            Content: notices[0].NoticeContent
        });
    }

    //获取手机公告
    public async getMobileNotices(){
        let notices = await DBManager.get().systemDB.getNotice(1);
        if (!notices || notices.length==0)
            return Response.ERROR('暂无手机公告。');
        let ret = [];
        for (let notice of notices){
            ret.push({
                Subject:notice.NoticeTitle,
                Content:notice.NoticeContent,
                PublishTime:notice.PublishTime,
            });
        }
        return Response.OK(ret);
    }

    //获取图片活动公告
    public async getActivityNotices(){
        let notices = await DBManager.get().systemDB.getNotice(2);
        if(!notices || notices.length==0)
            return Response.ERROR('暂无活动公告。');

        let config = await DBManager.get().systemDB.getConfig('ImageDomain');
        let imageDomain:string = !config?'':(config.ConfigValue);
        let ret = [];
        for (let notice of notices){
            ret.push({
                Subject:notice.NoticeTitle,
                Content:notice.NoticeContent,
                Image:imageDomain+notice.NoticeImage,
                PublishTime:notice.PublishTime,
            });
        }
        return Response.OK(ret);
    }
}