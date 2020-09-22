const {ccclass, property} = cc._decorator;

@ccclass
export default class PokerCard extends cc.Component {

    @property(cc.SpriteAtlas)
    cardAtlas: cc.SpriteAtlas = null;

    get backSpriteFrame(): cc.SpriteFrame {
        return this.cardAtlas.getSpriteFrame('255');
    }

    private _card: number = 0;
    @property({
        type: cc.Integer
    })
    set card(value: number) {
        this._card = value;
        let sprite = this.cardAtlas.getSpriteFrame(value + '');
        if (!sprite) sprite = this.backSpriteFrame;
        this.node.getComponent(cc.Sprite).spriteFrame = sprite;
    }
    get card(): number {
        return this._card;
    }

    _shoot: boolean = false;
    @property
    set shoot(value: boolean) {
        if (value != this._shoot) {
            this.node.y = value ? this.distance : 0;
        }
        this._shoot = value;
    }
    get shoot() {
        return this._shoot;
    }

    @property({
        displayName: '弹起高度',
    })
    distance: number = 20;

    @property(cc.Color)
    grayColor: cc.Color = new cc.Color(200, 200, 200);


    _isGray: boolean = false;
    @property
    set isGray(value: boolean) {
        this._isGray = value;
        this.node.color = value ? this.grayColor : cc.Color.WHITE;
    }
    get isGray() {
        return this._isGray;
    }

    @property(cc.Color)
    selectColor: cc.Color = new cc.Color(175, 255, 220);
    _isSelect: boolean = false;
    @property
    set isSelect(value: boolean) {
        this._isSelect = value;
        if (value) {
            this.isGray = false;
        }
        this.node.color = value ? this.selectColor : cc.Color.WHITE;
    }
    get isSelect() {
        return this._isSelect;
    }
    // update (dt) {}
}
