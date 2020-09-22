import BaseClass from "./BaseClass";

const { ccclass, property } = cc._decorator;

interface IBaseInfo {
    UserID: number;
    GameID: number;
    NickName: string;
    FaceURL: string;
    ip: string;
}


@ccclass
export default class UserCtrl extends BaseClass {

    @property(cc.Label)
    m_labID: cc.Label = null;

    @property(cc.Label)
    m_labName: cc.Label = null;

    @property(cc.Sprite)
    m_spHead: cc.Sprite = null;

    @property(cc.Label)
    m_labIP: cc.Label = null;

    public async setUserByID(id: number) {
        var route = 'connector.userHandler.user';
        var res = await vv.pinus.request(route, {
            uid: id
        });
        if (res.status != 0) {
            console.warn(id + res.msg);
            return;
        }
        var base: IBaseInfo = res.data;

        var labName = this.m_labName || this.$('_labName', cc.Label);
        var labID = this.m_labID || this.$('_labID', cc.Label);
        let labIP = this.m_labIP || this.$('_labIP', cc.Label);
        if (labName) labName.string = decodeURI(base.NickName);
        if (labID) labID.string = base.GameID + '';
        if (labIP) labIP.string = base.ip;
        this._setHead(base.UserID, base.FaceURL);
    }

    private _setHead(userID: number, faceUrl: string) {
        var spHead = this.m_spHead || this.$('_spHead', cc.Sprite);
        if (!spHead) return;
        if (faceUrl == '') {
            spHead.spriteFrame = vv.preload.m_HeadDef;
            return;
        }
        var sp: cc.SpriteFrame = vv.preload.m_UserHeadMap[userID];
        if (sp) {
            spHead.spriteFrame = sp;
            return;
        }
        var url = `http://${SERVER_IP}:${HTTP_PORT}/image?url=${faceUrl}`;
        cc.loader.load({ url: url, type: 'jpg' }, function (err, texture) {
            if (err || !texture) return;
            vv.preload.m_UserHeadMap[userID] = new cc.SpriteFrame(texture);
            spHead.spriteFrame = vv.preload.m_UserHeadMap[userID];
        }.bind(this));
    }
}
