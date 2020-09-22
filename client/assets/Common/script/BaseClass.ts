import GameAlert from "./GameAlert";
import Tips from "./Tips";
import UIKillerClass from "./UIKillerClass";
const { ccclass, property } = cc._decorator;


@ccclass
export default class BaseClass extends UIKillerClass {

    private m_tipName: string = 'Tips';
    private m_alertName: string = 'GameAlert';
    private m_loadingName: string = 'Loading';
    private m_loadCallTimes: number = 0;
    public m_loadPrefab: any = {};
    public m_Hook: any;
    private m_Events: string[] = [];

    /**
     * @method
     * @param {string} name resouse/Prefab 下的prefab的名字
     * @param {cc.Node} parent 加载成功的prfab在哪个父节点下, 如果不存在默认是this.node
     * @returns {any} 返回同名脚本 亲确保prefab上有同名基于BaseClass的脚本, 否则返回null
     * @desc 异步接口
     */
    public async showPrefab<T>(name: string, parent?: cc.Node): Promise<T> {
        if (name == '') {
            console.trace(name);
            return;
        }
        if (parent == null) parent = this.node;

        var fn = () => {
            if (!this.m_loadPrefab[name]) {
                console.warn('BaseClass cannot find ' + name + ' prefab');
                return;
            }
            this.m_loadPrefab[name].active = true;
            var js = this.m_loadPrefab[name].getComponent(name) ||
                this.m_loadPrefab[name].getComponent('ActionClass');
            if (!js) {
                console.warn('prefab cannot find plugin ' + name);
                return null;
            }
            js.m_Hook = this;
            if (js.showView) js.showView();
            return js;
        };

        var clone = (pre: cc.Prefab): void => {
            var node: cc.Node = cc.instantiate(pre);
            node.parent = parent;
            this.m_loadPrefab[name] = node;
        };

        if (this.m_loadPrefab[name]) {
            return fn();
        }

        var pre: cc.Prefab = vv.preload.m_Prefab[name];
        if (pre) {
            clone(pre);
            return fn();
        }

        pre = await this.loadPrefab(name);
        clone(pre);
        return fn();
    }

    /**
     * @method
     * @param {string} name resouse/Prefab 下的prefab的名字
     * @returns {Promise} 异步返回prefab
     * @desc 用于单个加载Prefab
     */
    private async loadPrefab(name: string): Promise<cc.Prefab> {
        return new Promise((resolve, reject) => {
            cc.loader.loadRes('prefab/' + name, cc.Prefab, (err: Error, pre: any) => {
                if (err) {
                    console.error(err.message || err);
                    resolve();
                    return;
                }
                vv.preload.m_Prefab[name] = pre;
                resolve(pre)
            });
        })
    }

    /**
     * @method
     * @desc  1.加载 resouse/Prefab/Loading 下的Prfab, 
     *        2.请确保showLoad 和 hideLoad 成对出现, 否则会出现loading下不去的问题
     */
    public async showLoad(): Promise<any> {
        if (this.m_loadCallTimes == 0) {
            await this.showPrefab(this.m_loadingName);
        }
        this.m_loadCallTimes++
    }

    public hideLoad(): void {
        this.m_loadCallTimes--;
        if (this.m_loadCallTimes < 0) this.m_loadCallTimes = 0;
        var node: cc.Node = this.m_loadPrefab[this.m_loadingName];
        if (this.m_loadCallTimes == 0 && node) node.active = false;
    }

    public hideAllLoad(): void {
        this.m_loadCallTimes = 0;
        var node: cc.Node = this.m_loadPrefab[this.m_loadingName];
        if (node) node.active = false;
    }

    async showAlert(str: string, style?: number, cb?: (res: boolean) => void, node?: cc.Node): Promise<any> {
        var js: GameAlert = await this.showPrefab(this.m_alertName, node);
        js.node.zIndex = 100;
        js.showAlert(str, style, cb);
    }

    public showTips(str: string): void {
        var node: cc.Node = cc.instantiate(vv.preload.m_Prefab[this.m_tipName]);
        if (node) {
            this.node.addChild(node);
            node.getComponent(Tips).show(str);
        }
    }

    public showView() {
        this.onActionShow();
        this.onShowView();
    }

    public async hideView() {
        var delay: number = await this.onHideView() + this.onActionHide();
        if (delay) {
            this.scheduleOnce(this._hideView, delay)
        } else {
            this._hideView();
        }
    }

    /**
     * @method
     * @returns {number} 返回延时时间, 延时关闭界面
     * @desc 用于子类重写, 当调用hideView
     */
    public async onHideView(): Promise<number> { return 0; }

    public async onShowView() { }

    private _hideView() {
        this.node.active = false;
    }

    public _onBtClose() {
        this.hideView();
    }

    public onActionShow() { }

    public onActionHide(): number { return 0; }

    public _isRegisted = false;

    public on(event: string[]) {
        this.m_Events = this.m_Events.concat(event);
        vv.pinus.onEvents(event, this);
    }

    onDestroy() {
        if (!this.m_Events.length) return;
        vv.pinus.offEvents(this.m_Events, this)
    }
}

