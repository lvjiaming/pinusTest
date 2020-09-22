const { ccclass, property } = cc._decorator;

@ccclass
export default class CustomSprite extends cc.Component {

    @property([cc.SpriteFrame])
    spriteFrame: cc.SpriteFrame[] = [];


    _index: number = 0;

    @property({
        type: cc.Integer,
        range: [0, 10]
    })
    set index(idx: number) {
        this._index = idx;
        if (this.spriteFrame[idx]) {
            this.node.getComponent(cc.Sprite).spriteFrame = this.spriteFrame[idx];
        }
    }
    get index(): number {
        return this._index;
    }

}
