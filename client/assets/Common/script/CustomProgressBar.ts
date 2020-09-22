const { ccclass, property } = cc._decorator;

@ccclass
export default class CustomProgressBar extends cc.ProgressBar {

    _progress: number = 0;

    @property({
        override: true,
        range: [0, 1]
    })
    set progress(pro: number) {
        this._progress = pro;
        if (this.mode == cc.ProgressBar.Mode.HORIZONTAL) {
            this.barMask.node.width = this.progress * this.node.width;
        } else {
            this.barMask.node.height = this.progress * this.node.height;
        }
    }
    get progress(): number {
        return this._progress;
    }

    @property(cc.Mask)
    barMask: cc.Mask = null;

}
