import ActionClass from "../../Common/script/ActionClass";

const { ccclass, property } = cc._decorator;

var MAX_NUM = 6;

@ccclass
export default class JoinRoom extends ActionClass {


    private length: number = 0;

    private labNum: cc.Label[] = [];
    onLoad() {
        var children = this.$('_Num').children;
        for (var i = 0; i < MAX_NUM; i++) {
            this.labNum[i] = children[i].getComponent(cc.Label);
            children[i].active = false;
        }
    }

    public async onShowView() {
        this._onBtClear();
    }


    async _onBtNum(event: cc.Component.EventHandler, data: string) {
        if (this.length == MAX_NUM) return;
        this.labNum[this.length].string = data;
        this.labNum[this.length++].node.active = true;
        if (this.length == MAX_NUM) {
            await this._sendEnter(this._getNum());
        }
    }

    _onBtDel() {
        if (this.length == 0) return;
        this.labNum[--this.length].node.active = false;
    }

    _onBtClear() {
        this.labNum.forEach(lab => {
            lab.node.active = false;
        });
        this.length = 0;
    }

    _getNum(): number {
        var str = '';
        for (var i in this.labNum) {
            if (!this.labNum[i].node.active) {
                console.warn('error _getNum ' + i);
                return 0;
            }
            str += this.labNum[i].string;
        }
        return parseInt(str);
    }

    async  _sendEnter(roomID: number) {
        var route = 'hall.roomHandler.joinRoom';
        var res = await vv.pinus.request(route, { roomID: roomID });
        if (res.status != 0) {
            this.showAlert(res.msg);
            return;
        }
        vv.roomInfo = res.data;
        cc.director.loadScene(vv.roomInfo.KindID + '')
    }
}
