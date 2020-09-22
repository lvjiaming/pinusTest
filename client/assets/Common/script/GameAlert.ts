import UIKillerClass from "./UIKillerClass";
const { ccclass, property } = cc._decorator;

@ccclass
export default class GameAlert extends UIKillerClass {

    private m_nodeBT: cc.Node[];

    private m_fnCallBack: (res: boolean) => void = null;

    public onLoad() {
        this.m_nodeBT = [this.$('_btSure#0'), this.$('_btSure#1'), this.$('_btClose')];
    }

    public showAlert(str: string, style?: number, callback?: (res: boolean) => void) {
        style = style || Alert.Yes;
        this.$('_labMsg', cc.Label).string = str;
        this.m_fnCallBack = callback;
        for (var i in this.m_nodeBT) {
            this.m_nodeBT[i].active = parseInt(i) <= style;
        }
    }

    private _onBtSure (tag: any, data: string) {
        var res: boolean;
        if (data == '0') res = true;
        else res = false;
        if (this.m_fnCallBack != null) {
            this.m_fnCallBack(res);
        }
        this.node.active = false;
    }
}
