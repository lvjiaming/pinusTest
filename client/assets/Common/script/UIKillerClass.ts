const { ccclass, property } = cc._decorator;

@ccclass
export default class UIKillerClass extends cc.Component {
    protected m_nodePool: any = {};

    protected m_bOpen: boolean = true;

    protected isInit: boolean = false;

    public __preload() {
        if (this.m_bOpen && !this.isInit) {
            this._init();
        }
    }

    public _init() {
        this.m_nodePool = vv.uikiller.bindThor(this.node, this);
        this.isInit = true;
    }

    public $<T extends cc.Component>(name: string, type: { prototype: T }): T;
    public $(name: string): cc.Node;

    public $<T extends cc.Component>(name: string, type?: { prototype: T }): (T | cc.Node) {
        if (!this.isInit && this.m_bOpen) this._init();
        var node: cc.Node = this.m_nodePool[name];
        if (!node) {
            // console.log('cannot find ' + name);
            return null;
        }
        if (type) {
            return node.getComponent(type);
        }
        else {
            return node;
        }
    }

    public _onBtSound() {
        vv.audio.playEffect('ui_click');
    }

    public onBtSound() {
        vv.audio.playEffect('ui_click');
    }

    public _onBtClose() {
        this.node.active = false;
    }
}



