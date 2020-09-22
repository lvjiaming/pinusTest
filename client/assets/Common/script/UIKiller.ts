export default class UIKiller {

    private isOpenTips = false;

    private _prefix: string = '_';
    private _preEnd: string = '$';
    private _preSound: string = '_onBtSound';

    public bindThor(node: cc.Node, js?: any): any {

        var obj: any = {};
        this._bindSound(node, js);
        this._bindClickEvent(node, js);
        this._bindNode(node, obj);
        return obj;
    }

    private _getComponentName(component) {
        try {
            return component.name.match(/<.*>$/)[0].slice(1, -1);
        } catch (e) {
            console.log(e);
        }
    }

    private _bindNode(node: cc.Node, obj: any): void {
        node.children.forEach((child: cc.Node) => {
            let name: string = child.name;
            if (name[0] === this._prefix) {
                if (obj[name] == null) {
                    obj[name] = child;
                }
            }
            this._bindNode(child, obj);
        });
    }

    //当编辑器里button以_bt${name}开头的 自动绑定当前脚本下_onBt${name}点击事件
    //注意函数name的首字母是大写,根据驼峰命名方式
    private _bindClickEvent(node: cc.Node, js?: any) {
        if (js == null) return;
        let btArr: cc.Button[] = node.getComponentsInChildren(cc.Button);
        for (let bt of btArr) {
            let name: string = bt.node.name;
            if (name.slice(0, 3) === '_bt') {
                name = name.slice(3);
                let ParseArr: string[] = name.split('#');
                name = ParseArr[0];
                name = name.slice(0, 1).toUpperCase() + name.slice(1);
                let FuncName: string = '_onBt' + name;
                this._bindEvent(bt, FuncName, js, ParseArr[1]);
            }
        }
    }

    //编辑器里button命名结尾 存在$ 则自动绑定声音
    //绑定完声音函数, 会将名字后$删掉
    //所以要想获取node this._btReady or this.getChildByName('_btReady') 结尾不用加$
    private _bindSound(node: cc.Node, js?: any) {
        if (js == null) return;
        let FuncName: string = this._preSound;
        let btArr: cc.Button[] = node.getComponentsInChildren(cc.Button);
        for (let bt of btArr) {
            if (bt.node.name.slice(-1) === this._preEnd) {
                if (this._bindEvent(bt, FuncName, js)) {
                    bt.node.name = bt.node.name.slice(0, -1);
                }
            }
        }
    }

    private _bindEvent(bt: cc.Button, name: string, js: any, param?: string) {
        if (this._eixstEvent(bt, name)) {
            return false;
        }
        if (!js[name]) {
            if (this.isOpenTips) {
                console.warn(this._getComponentName(js) + '脚本下无' + name + '函数, 绑定点击事件失败!');
            }
            return false;
        }
        let eventHandler: cc.Component.EventHandler = new cc.Component.EventHandler();
        eventHandler.target = js.node;
        eventHandler.component = this._getComponentName(js);
        eventHandler.handler = name;
        if (param != null) eventHandler.customEventData = param;
        bt.clickEvents.push(eventHandler);
        return true;
    }

    private _eixstEvent(button: cc.Button, func: string): boolean {
        for (let event of button.clickEvents) {
            if (event.handler == func) {
                return true;
            }
        }
        return false;
    }
}


