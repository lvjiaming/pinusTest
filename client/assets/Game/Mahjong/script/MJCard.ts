
const { ccclass, property, executeInEditMode } = cc._decorator;

export enum DIR {
    UP = 0,
    DOWN,
    LEFT,
    RIGHT
}

export enum TYPE {
    STAND = 0,
    LIE
}

@ccclass
// 在编辑器界面执行声明周期
@executeInEditMode
export default class MJCard extends cc.Component {

    _dirFlower: string[] = ['u', 'd', 'l', 'r'];

    _dirBack: string[] = ['Up', 'Up', 'Left', 'Right'];

    _direction: DIR = DIR.DOWN;
    @property({
        type: cc.Enum(DIR),
    })
    set direction(value: DIR) {
        this._direction = value;
        this._setFlower();
    }
    get direction() {
        return this._direction;
    }

    _type: TYPE = TYPE.STAND;
    @property({
        type: cc.Enum(TYPE)
    })
    set type(value: TYPE) {
        this._type = value;
        this._setFlower();
    }
    get type() {
        return this._type;
    }

    @property(cc.SpriteAtlas)
    flowerAtlas: cc.SpriteAtlas = null;

    @property(cc.SpriteAtlas)
    backAtlas: cc.SpriteAtlas = null;

    get cardBack(): cc.Sprite {
        return this.node.getChildByName('back').getComponent(cc.Sprite);
    }

    get cardFlower(): cc.Sprite {
        return this.node.getChildByName('flower').getComponent(cc.Sprite);
    }

    _scale: number = 1;
    @property({
        tooltip: '只会改变子节点缩放, 根节点不会变'
    })
    set scale(value: number) {
        this._scale = value;
        this._setFlower();
    }
    get scale() {
        return this._scale;
    }
    _color: cc.Color = cc.Color.WHITE;
    @property({
        type: cc.Color
    })
    set color(value: cc.Color) {
        this._color = value;
        this.cardBack.node.color = value;
        this.cardFlower.node.color = value;
    }
    get color(): cc.Color {
        return this._color;
    }

    _card: number = 0;

    @property({
        type: cc.Integer
    })
    set card(value: number) {
        this._card = value;
        this._setFlower();
        this.isMagic = this._hunCard == this._card;
    }

    get card() {
        return this._card;
    }
    _hunCard: number = 0;
    set hunCard(value: number) {
        this._hunCard = value;
        this.isMagic = this._hunCard == this._card;
    }

    @property(cc.Color)
    grayColor: cc.Color = new cc.Color(200, 200, 200);


    _isGray: boolean = false;
    @property
    set isGray(value: boolean) {
        this._isGray = value;
        if (!value) {
            this.color = this.isSelect ? this.selectColor : cc.Color.WHITE;
        } else {
            this.color = this.grayColor;
        } 
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
        if (!value) {
            this.color = this.isGray ? this.grayColor : cc.Color.WHITE;
        } else {
            this.color = this.selectColor;
        } 
    }
    get isSelect() {
        return this._isSelect;
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

    @property
    set isMagic(value: boolean) {
        this.magicNode.active = value;
    }
    get isMagic(): boolean {
        return this.magicNode.active;
    }
    get magicNode(): cc.Node {
        if (this.cardFlower.node.getChildByName('magic') == null) {
            let node = new cc.Node('magic');
            let sp = node.addComponent(cc.Sprite);
            node.parent = this.cardFlower.node;
            this._setMagic(node);
            node.active = false;
            return node;
        }
        return this.cardFlower.node.getChildByName('magic');
    }

    isInit: boolean = false;

    _setBack(showFlower: boolean) {
        var str = this._dirBack[this._direction];
        str += showFlower ? 'Front' : 'Back';
        str += this._type == TYPE.STAND ? 'Stand' : 'Lie';
        this.cardBack.spriteFrame = this.backAtlas.getSpriteFrame(str);
        this.cardBack.node.scale = this.scale;
        this.cardFlower.node.scale = this.scale;
        this.node.width = this.cardBack.node.width * this._scale;
        this.node.height = this.cardBack.node.height * this._scale;
        if (this._direction == DIR.UP && this._type == TYPE.LIE) {
            this.cardFlower.node.angle = 180;
            this.cardFlower.node.y = 30 * this._scale;
        } else {
            this.cardFlower.node.angle = 0;
            this.cardFlower.node.y = 0;
        }
        this._setMagic(this.magicNode);
    }

    _setMagic(node: cc.Node) {
        let pos = [cc.v2(-16.5, 27.5), cc.v2(-16.5, 27.5), cc.v2(20, 13), cc.v2(-19, 13), cc.v2(-21, 25)];
        let size = [cc.v2(30, 30), cc.v2(30, 30), cc.v2(20, 20), cc.v2(20, 20), cc.v2(50, 60)];
        let name = ['hunlie', 'hunlie', 'hunl', 'hunr', 'hunstand'];
        let idx = this._type == TYPE.STAND ? 4 : this._direction;
        node.getComponent(cc.Sprite).spriteFrame = this.backAtlas.getSpriteFrame(name[idx]);
        node.setPosition(pos[idx]);
        node.height = size[idx].y;
        node.width = size[idx].x;
    }

    _setFlower(): void {
        if (!this.isInit) {
            this._setDefault();
            return;
        }
        var str = '';
        if (this._direction == DIR.LEFT) {
            if (this._type == TYPE.STAND) {
                str = '';
            } else {
                str = 'l';
            }
        } else if (this._direction == DIR.RIGHT) {
            if (this._type == TYPE.STAND) {
                str = '';
            } else {
                str = 'r';
            }
        } else if (this._direction == DIR.UP || this.direction == DIR.DOWN) {
            if (this._type == TYPE.STAND) {
                str = 'd';
            } else {
                str = 'u';
            }
        }
        var sprite = this.flowerAtlas.getSpriteFrame(str + this._card);
        if (sprite == null) {
            this.cardFlower.node.active = false;
        } else {
            this.cardFlower.spriteFrame = sprite;
            this.cardFlower.node.active = true;
        }
        this._setBack(sprite != null);
    }

    __preload() {
        this._setDefault();
    }

    // 坑逼的cocos无法在prefab中保存属性变量,只能保存节点信息, 因此根据节点信息恢复属性
    private _setDefault() {
        if (this._card == 0) {
            if (this.node.getChildByName('flower').active) {
                let flower = this.node.getChildByName('flower').getComponent(cc.Sprite).spriteFrame;
                this._card = parseInt(flower.name.slice(1));
            } else {
                this._card = 0;
            }
        }

        let back = this.node.getChildByName('back').getComponent(cc.Sprite).spriteFrame.name;
        if (back.slice(0, 4) == 'Left') {
            this._direction = DIR.LEFT;
        } else if (back.slice(0, 5) == 'Right') {
            this._direction = DIR.RIGHT;
        } else {
            if (this.node.getChildByName('flower').angle == 0) {
                this._direction = DIR.DOWN;
            } else {
                this._direction = DIR.UP;
            }
        }
        if (back.slice(-5) == 'Stand') {
            this._type = TYPE.STAND;
        } else {
            this._type = TYPE.LIE;
        }
        if (this._scale == 1) {
            this._scale = this.node.getChildByName('back').scale;
        }
        this.isInit = true;
        this._setFlower();
    }
}
