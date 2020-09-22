import BaseClass from "../../Common/script/BaseClass";
import UIKillerClass from "../../Common/script/UIKillerClass";
import UserCtrl from "../../Common/script/UserCtrl";
import GameReplay from "../../Game/Public/script/GameReplay";

const { ccclass, property } = cc._decorator;


interface IDetailData {
    DrawID: number;
    StartTime: string;
    user: { userID: number, score: number }[];
}
@ccclass
export default class GameRecordDetail extends BaseClass {


    @property(cc.Node)
    layout: cc.Node = null;

    private color: cc.Color[] = [new cc.Color(221.88, 26), new cc.Color(216, 144, 76)];

    private videoData: string = '';

    onLoad() {
        this.on(['onReplayDataDetail']);
    }

    public async setView(data: IDetailData[]) {
        this.layout.children.forEach(node => node.active = false);
        for (let i = 0; i < data.length; i++) {
            let node = this.layout.children[i] || cc.instantiate(this.layout.children[0]);
            node.parent = this.layout;
            let js = node.getComponent(UIKillerClass);
            js.$('_labNO', cc.Label).string = ('00' + (i + 1)).slice(-2);
            js.$('_labTime', cc.Label).string = data[i].StartTime;
            let users = js.$('_layout').children;
            for (let j in users) {
                users[j].active = !!data[i].user[j];
                if (!data[i].user[j]) continue;
                let userjs = users[j].getComponent(UIKillerClass);
                users[j].getComponent(UserCtrl).setUserByID(data[i].user[j].userID);
                userjs.$('_labScore', cc.Label).string = (data[i].user[j].score > 0 ? '+' : '') + data[i].user[j].score;
                userjs.$('_labScore').color = data[i].user[j].score > 0 ? this.color[0] : this.color[1];
            }
            node.active = true;
            (<any>node).customData = {
                drawID: data[i].DrawID
            };
        }
    }

    async _onBtReplay(event: cc.Component.EventHandler, data: string) {
        let drawID = (<any>event.target.parent).customData.drawID;
        let route = 'hall.hallHandler.getReplayALL';
        this.videoData = '';
        await vv.pinus.notify(route, { drawID: drawID });
    }

    onReplayDataDetail(data) {
        if (typeof data == 'object') {
            if (data.status != 0) {
                this.showAlert(data.msg);
            } else {
                vv.replay = JSON.parse(this.videoData);
                cc.director.loadScene(vv.replay.roomInfo.KindID + '', async () => {
                    // 等待全部加载完成显示Replay界面
                    if (vv.gameClient) {
                        let js = await vv.gameClient.showPrefab<GameReplay>('GameReplay');
                        js.setView(data.data.curDrawID, data.data.drawIDs);
                    }
                });
            }
        } else {
            this.videoData += data;   
        }
    }
}
