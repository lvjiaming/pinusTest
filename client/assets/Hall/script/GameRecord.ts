import BaseClass from "../../Common/script/BaseClass";
import UIKillerClass from "../../Common/script/UIKillerClass";
import UserCtrl from "../../Common/script/UserCtrl";
import GameRecordDetail from "./GameRecordDetail";
const { ccclass, property } = cc._decorator;


interface IRecordData {
    KindID: number;
    RoomID: number;
    ServiceID: number;
    StartTime: string;
    user: { userID: number, score: number }[];
}
@ccclass
export default class GameRecord extends BaseClass {

    @property(cc.Node)
    layout: cc.Node = null;

    @property(cc.Node)
    msg: cc.Node = null;

    private color: cc.Color[] = [new cc.Color(221.88,26), new cc.Color(216, 144, 76)]

    setView(data: IRecordData[]) {
        this.layout.children.forEach(node => node.active = false);
        if (data && data.length > 0) {
            this.msg.active = false;
            for (let i in data) {
                let info = data[i];
                let node = this.layout.children[i] || cc.instantiate(this.layout.children[0]);
                node.parent = this.layout;
                let js = node.getComponent(UIKillerClass);
                js.$('_labRoomID', cc.Label).string = info.RoomID + '';
                js.$('_labTime', cc.Label).string = info.StartTime;
                let nodeUser = js.$('_layout').children;
                for (let j in nodeUser) {
                    nodeUser[j].active = !!info.user[j];
                    if (!info.user[j]) continue;
                    let jsUser = nodeUser[j].getComponent(UIKillerClass);
                    jsUser.$('_userInfo', UserCtrl).setUserByID(info.user[j].userID);
                    jsUser.$('_labScore', cc.Label).string = (info.user[j].score > 0 ? '+' : '') + info.user[j].score;
                    jsUser.$('_labScore').color = info.user[j].score > 0 ? this.color[0] : this.color[1];
                }
                (<any>node).customData = {
                    serviceID: info.ServiceID
                };
                node.active = true;
            }
        } else {
            this.msg.active = true;
        }
    }

    async _onBtDetail(event: cc.Component.EventHandler, data: string) {
        let id = (<any>event.target.parent).customData.serviceID;
        var route = 'hall.hallHandler.getGameRecordDetail';
        var res = await vv.pinus.request(route, { serviceID: id });
        let js = await this.showPrefab<GameRecordDetail>('GameRecordDetail');
        js.setView(res.data);
    }
}
