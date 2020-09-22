import BaseClass from "../../../Common/script/BaseClass";
import UserCtrl from "../../../Common/script/UserCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GpsCtrl extends BaseClass {

    onLoad() {

    }

    async onShowView() {
        let children = this.$('_UserNode').children;
        for (let i in children) {
            let sitUser = vv.gameClient.sitUser[vv.gameClient.view2Chair(parseInt(i))];
            children[i].active = !!sitUser;
            let js = children[i].getComponent(UserCtrl);
            if (sitUser) {
                js.setUserByID(sitUser.UserInfo.UserID);
                js.$('_labNoGPS').active = true;
                js.$('_labNoGPS', cc.Label).string = sitUser.GPSInfo ? sitUser.GPSInfo.sortadd :'未获取到GPS信息';
            }
        }
        for (let i = 0; i < vv.gameClient.sitUser.length - 1; i++) {
            if (vv.gameClient.sitUser[i] == null) continue;
            for (let j = i + 1; j < vv.gameClient.sitUser.length; j++) {
                if (vv.gameClient.sitUser[j] == null) continue;
                let a = vv.gameClient.sitUser[i].GPSInfo;
                let b = vv.gameClient.sitUser[j].GPSInfo;
                let viewA = vv.gameClient.chair2View(i);
                let viewB = vv.gameClient.chair2View(j);
                let name = viewA > viewB ? `_${viewB}to${viewA}` : `_${viewA}to${viewB}`;
                let lab = this.$(name, cc.Label);
                if (a == null || b == null) {
                    lab.node.active = false;
                } else {
                    lab.node.active = true;
                    lab.string = GpsCtrl._getDistance(a.latitude, a.longitude, b.latitude, b.longitude) + 'km';
                }
            }
        }
        this.$('_warn', cc.Toggle).isChecked = GpsCtrl.isWarn(vv.gameClient.sitUser);
    }

    static isWarn(sitUser: ITableUser[]): boolean {
        for (let i = 0; i < sitUser.length - 1; i++) {
            if (sitUser[i] == null) continue;
            for (let j = i + 1; j < sitUser.length; j++) {
                if (sitUser[j] == null) continue;
                let a = sitUser[i].GPSInfo;
                let b = sitUser[j].GPSInfo;
                if (a == null || b == null) {
                    return true;
                }
                if (this._getDistance(a.latitude, a.longitude, b.latitude, b.longitude) < 0.2) return true;
            }
        }
        return false;
    }

    static _rad(d: number): number {
        return d * Math.PI / 180.0; //经纬度转换成三角函数中度分表形式。
    }
    //计算距离，参数分别为第一点的纬度，经度；第二点的纬度，经度
    static _getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        var radLat1 = this._rad(lat1);
        var radLat2 = this._rad(lat2);
        var a = radLat1 - radLat2;
        var b = this._rad(lng1) - this._rad(lng2);
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137; // EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000; //输出为公里
        s = Math.round(s * 100) / 100;
        return s;
    }
}
