import BaseClass from "../../../Common/script/BaseClass";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DirectionCtrl extends BaseClass {

    dirAngle: number[] = [90, 0, -90, -180];

    @property(cc.Node)
    nodeDir: cc.Node[] = [];

    @property(cc.Label)
    leftCnt: cc.Label = null;

    onLoad() {
        this.on(['onUserCanOut', 'onUpdateLeftCnt']);
        this.nodeDir.forEach(node => {
            node.runAction(cc.repeatForever(cc.sequence(cc.fadeOut(1), cc.fadeIn(1))));
            node.active = false;
        })
    }

    onUserCanOut({ currentUser }: { currentUser: number }) {
        this.setCurrent(currentUser);
    }

    onUpdateLeftCnt (left) {
        this.setLeftCard(left);
    }

    public setChair(chair: number) {
        this.node.getChildByName('dir').angle = this.dirAngle[chair];
    }

    public setCurrent(chair: number) {
        for (let i = 0; i < this.nodeDir.length; i++) {
            this.nodeDir[i].active = chair == i;
        }
    }

    setLeftCard(cnt: number) {
        this.leftCnt.string = cnt + '';
        this.leftCnt.node.parent.active = true;
    }

    public resetView() {
        this.setCurrent(-1);
        this.leftCnt.node.parent.active = false;
    }
}
