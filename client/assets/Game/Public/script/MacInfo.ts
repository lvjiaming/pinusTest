import CustomSprite from "../../../Common/script/CustomSprite";
import ThirdParty from "../../../Common/script/ThirdParty";
import UIKillerClass from "../../../Common/script/UIKillerClass";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MacInfo extends UIKillerClass {

    onLoad() {
        this._check();
        this._checkTime();
        this.schedule(this._check.bind(this), 3);
        this.schedule(this._checkTime.bind(this), 1);
    }

    _check() {
        let lv = ThirdParty.getBattery();
        if (lv < 0.5) {
            this.$('_spPower', CustomSprite).index = 0;
        } else if (lv < 0.75) {
            this.$('_spPower', CustomSprite).index = 1;
        } else if (lv <= 1) {
            this.$('_spPower', CustomSprite).index = 2;
        } else {
            this.$('_spPower', CustomSprite).index = 3;
        }
        if (window['pomelo'].delay > 300) {
            this.$('_spNet', CustomSprite).index = 0;
        } else if (window['pomelo'].delay > 200) {
            this.$('_spNet', CustomSprite).index = 1;
        } else if (window['pomelo'].delay > 100) {
            this.$('_spNet', CustomSprite).index = 2;
        } else {
            this.$('_spNet', CustomSprite).index = 3;
        }
        if (window['pomelo'].delay > 1000) {
            this.$('_sp4G', CustomSprite).index = 0;
        } else if (window['pomelo'].delay > 500) {
            this.$('_sp4G', CustomSprite).index = 1;
        } else if (window['pomelo'].delay > 300) {
            this.$('_sp4G', CustomSprite).index = 2;
        } else if (window['pomelo'].delay > 200) {
            this.$('_sp4G', CustomSprite).index = 3;
        } else if (window['pomelo'].delay > 100) {
            this.$('_sp4G', CustomSprite).index = 4;
        } else {
            this.$('_sp4G', CustomSprite).index = 5;
        }
        let isWifi = ThirdParty.isWifi();
        this.$('_sp4G').active = !isWifi;
        this.$('_spNet').active = !!isWifi;
    }

    _checkTime() {
        let date = new Date()
        let str = this._pad(date.getHours()) + (':') + this._pad(date.getMinutes());
        this.$('_labTime', cc.Label).string = str;
    }

    _pad(num: number): string {
        return ('00' + num).slice(-2);
    }
}
