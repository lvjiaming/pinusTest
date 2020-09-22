import UIKillerClass from "./UIKillerClass";
const { ccclass, property } = cc._decorator;

@ccclass
export default class Tips extends UIKillerClass {

    public onLoad() {
        this.node.setPosition(0, -(SCENE_HEIGHT / 2));
        var act: cc.ActionInterval = cc.sequence(cc.moveTo(0.2, cc.v2(0, 80)), cc.delayTime(0.8));
        this.node.runAction(cc.sequence(act, cc.removeSelf(true)));
    }

    public show(msg: string): void {
        this.$('_labMsg', cc.Label).string = msg;
        this.$('_spBg').height = this.$('_labMsg').height;
    }
}
