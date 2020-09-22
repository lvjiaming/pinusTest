const {ccclass, property} = cc._decorator;

@ccclass
export default class CustomSlider extends cc.Slider {

    _progress: number = 0;

    @property({
        override: true,
        range: [0, 1]
    })
    set progress (pro: number) {
        this._progress = pro;
        if (this.direction == cc.Slider.Direction.Horizontal) {
            this.mask.width = this.progress * this.node.width;
            this.handle.node.x = this.mask.x + this.mask.width;
        } else {
            this.mask.height = this.progress * this.node.height;
            this.handle.node.y = this.mask.y + this.mask.height;
        }
    }
    get progress(): number {
        return this._progress;
    }

    @property(cc.Node)
    mask: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
