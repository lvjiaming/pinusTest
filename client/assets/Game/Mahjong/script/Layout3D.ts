import MJCard, { DIR } from './MJCard';
import WeaveItem from './WeaveItem';
const { ccclass, property, executeInEditMode } = cc._decorator;

// 用于调整位置
@ccclass
@executeInEditMode
export default class Layout3D extends cc.Component {

    _direction: DIR = DIR.DOWN;
    @property({
        type: cc.Enum(DIR)
    })
    set direction(value: DIR) {
        this._direction = value;
        this._updateView();
    }
    get direction() {
        return this._direction;
    }
    _offset: number = 0;
    @property
    set offset(value: number) {
        this._offset = value;
        this._updateView();
    }
    get offset() {
        return this._offset;
    }

    _items: cc.Node[] = [];
    @property
    get items() {
        if (this._items.length == 0) {
            for (let i in this.node.children) {
                this._items[i] = this.node.children[i];
            }
        }
        return this._items;
    }

    _updateView() {
        let line = this._direction == DIR.DOWN || this._direction == DIR.UP;
        let index = 0;
        for (var i in this.items) {
            if (!this.items[i].active) continue;
            let js: any = this._getItem(this.items[index]);
            if (js != null) {
                js.direction = this._direction;
            }
            if (line) {
                this.items[index].y = 0;
            } else if (this._direction == DIR.LEFT) {
                this.items[index].x = - index * this._offset;
            } else {
                this.items[index].x = index * this._offset;
            }
            index++;
        }
        this.node.getComponent(cc.Layout).type = line ? cc.Layout.Type.HORIZONTAL : cc.Layout.Type.VERTICAL
    }

    _getItem (item) {
        let js: any = item.getComponent(MJCard);
        if (!js) js = item.getComponent(WeaveItem);
        if (js) return js;
        else return null;
    }

    onLoad () {
        if (this.node.getComponent(cc.Layout)) {
            let line = this.node.getComponent(cc.Layout).type === cc.Layout.Type.HORIZONTAL;
            if (line) {
                this._direction = this._getItem(this.items[0]).direction;
                this._offset = 0;
            } else {
                let offset = this.items[1].x - this.items[0].x;
                if (offset > 0) {
                    this._direction = DIR.RIGHT;
                } else {
                    this._direction = DIR.LEFT;
                }
                this._offset = offset;
            }
        }
    }
}
