import MJCard, {DIR} from "./MJCard";

const {ccclass, property} = cc._decorator;


export enum ARROW {
    NULL = 0,
    UP,
    LEFT,
    RIGHT,
}

@ccclass
export default class WeaveCard extends MJCard {

    _dirRotation: number[][] = [[0, 90, 180, 0], [0, -90, 0, 180], [0, 180, -90, 90], [0, 0, 90, -90]];
    _pos: cc.Vec2[] = [cc.v2(0, -8), cc.v2(0, -8), cc.v2(20, 12), cc.v2(-22, 12)];

    get arrow () {
        return this.node.getChildByName('arrow');
    }
    
    _arrowDir: ARROW = ARROW.NULL;
    @property({
        type: cc.Enum(ARROW)
    })
    set arrowDir(value: ARROW) {
        this._arrowDir = value;
        this.arrow.active = value != ARROW.NULL;
        this.arrow.angle = this._dirRotation[this.direction][value];
        this.arrow.height = this.direction == DIR.DOWN ? 30 : 20;
        this.arrow.width = this.direction == DIR.DOWN ? 30 : 20;
        this.arrow.setPosition(this._pos[this.direction]);
    }
    get arrowDir() {
        return this._arrowDir;
    }
}
