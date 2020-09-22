

/**
 * 网络工具类
 */
export default class Pinus {
    // 是否已连接
    public connected: boolean = false;

    /**
     * 初始化
     * @param callback 初始化完成的回调方法
     */
    public async init(ipConfig: IPConfig): Promise<null> {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                window["pomelo"].init(ipConfig, () => {
                    this.connected = true;
                    resolve();
                });
            }
        })
    }

    /**
     * 断开连接
     */
    public disconnect() {
        if (this.connected) {
            this.connected = false;
            window["pomelo"].disconnect();
        }
    }

    /**
     * 监听一次性事件
     * @param eventName 事件名
     * @param callback callback(data)回调方法
     * @param target 绑定的self
     */
    public once(eventName: string, callback: Function, target?: any) {
        if (this.connected) {
            window["pomelo"].once(eventName, callback.bind(target), target);
        }
    }

    /**
     * 监听事件
     * @param eventName 事件名
     * @param callback callback(data)回调方法
     * @param target 绑定的self
     */
    public on(eventName: string, callback: Function, target?: any) {
        window["pomelo"].on(eventName, callback.bind(target), target);
    }

    public onEvents(eventName: string[], target: any) {
        eventName.forEach(event => {
            try {
                window["pomelo"].on(event, target[event].bind(target), target);
            } catch (e) {
                console.log(event, target, e);
            }
        })
    }

    /**
     * 取消监听事件
     * @param eventName 事件名
     * @param callback callback(data)回调方法
     * @param target 绑定的self
     */
    public off(eventName?: string, callback?: Function, target?: any) {
        window["pomelo"].off(eventName, callback, target);
    }

    public offEvents(eventName: string[], target?: any) {
        eventName.forEach(event => {
            this.off(event, target[event], target);
        })
    }

    /**
     * 发送request
     * @param route 要发送request信息的handler
     * @param data 要发送的数据
     * @param callback callback(data)回调方法
     */
    public async request(route: string, data: Object): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                let userID = vv.userInfo ? vv.userInfo.UserID : '';
                if (LOG_NET && route != 'connector.userHandler.user') console.log('%c send:' + userID, 'color:#0f0;', route, data);
                window["pomelo"].request(route, data, (data: any) => {
                    if (LOG_NET && route != 'connector.userHandler.user') console.log('%c recive:' + userID, 'color:#f00;', route, data);
                    resolve(data);
                });
            }
            else {
                console.warn('请先建立连接!');
                reject();
            }
        });
    }

    /**
     * 发送notify
     * @param route 要发送request信息的handler
     * @param data 要发送的数据
     */
    public notify(route: string, data: Object) {
        if (this.connected) {
            let userID = vv.userInfo ? vv.userInfo.UserID : '';
            if (LOG_NET) console.log('%c send:' + userID, 'color:#0f0;', route, data);
            window["pomelo"].notify(route, data);
        }
    }
}