const { ccclass, property } = cc._decorator;
import BaseClass from "../../Common/script/BaseClass";

@ccclass
export default class ActionClass extends BaseClass {

    @property(cc.Node)
    m_nodeBlack: cc.Node = null;

    @property({
        tooltip: '建议第一次加载卡顿界面勾选',
        displayName: '以一次延时播放动画'
    })
    isLoad: boolean = false;

    private isDelay: boolean = false;

    private doubleClick: boolean = false;

    // LIFE-CYCLE CALLBACKS:

    public onActionShow() {
        if (this.isDelay) return;
        this.isDelay = true;
        this._controlBack();
        this.node.x = -SCENE_WIGHT;
        if (this.isLoad) {
            setTimeout(this._show.bind(this), 50);
            this.isLoad = false;
        } else {
            this._show();
        }
    }

    private _show() {
        this.node.runAction(cc.sequence(cc.moveTo(0.1, cc.v2(0, 0)),
            cc.callFunc((() => this.isDelay = false), this)));
    }

    private _controlBack() {
        if (this.m_nodeBlack != null) {
            let widget = this.m_nodeBlack.getComponent(cc.Widget) || this.m_nodeBlack.addComponent(cc.Widget);
            widget.target = this.node.parent;
            widget.isAlignHorizontalCenter = true;
            widget.isAlignVerticalCenter = true;
            widget.alignMode = cc.Widget.AlignMode.ALWAYS;
        }
    }

    public onActionHide() {
        this.node.runAction(cc.moveTo(0.1, cc.v2(-SCENE_WIGHT, 0)));
        return 0.1
    }

    // update (dt) {}
}
