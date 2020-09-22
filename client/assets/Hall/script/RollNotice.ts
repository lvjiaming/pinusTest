import BaseClass from "../../Common/script/BaseClass";

const { ccclass, property } = cc._decorator;

var INTERVAL = 1; //间隔时间
var SPEED = 150
@ccclass
export default class RollNotice extends BaseClass {

    m_iTimes: number = null;

    m_leftTime: number = INTERVAL;

    public m_szMsg: string = '';

    onLoad() {
        this.on(['onRollNotice']);
    }

    onRollNotice(res: IResponse) {
        if (res.status != 0) this.m_szMsg = '';
        if (this.m_szMsg == '') this.$('_labMessage', cc.Label).string = res.data.Content;
        this.m_szMsg = res.data.Content;
    }

    //times = null 无限循环
    public rollMessage(times?: number) {
        this.m_iTimes = times;
        this.$('_labMessage', cc.Label).string = this.m_szMsg;
        this.$('_labMessage').x = this.$('_labMessage').parent.width / 2 + 10;
    }

    update(dt) {
        if (this.node.active == false || this.m_szMsg === '') return;
        if (this.m_iTimes != null && this.m_iTimes <= 0) return;
        if (this.m_leftTime > 0) {
            this.m_leftTime -= dt;
            return;
        }
        this.$('_labMessage').x -= dt * SPEED;
        if (this.$('_labMessage').x < (-this.$('_labMessage').parent.width / 2 - this.$('_labMessage').width)) {
            this.$('_labMessage').x = this.$('_labMessage').parent.width / 2 + 10;
            if (this.m_iTimes != null) this.m_iTimes--;
            this.m_leftTime = INTERVAL;
            if (this.m_szMsg)
                this.$('_labMessage', cc.Label).string = this.m_szMsg;
            if (this.m_iTimes <= 0) this.rollEnd();
        }
    }

    //预留接口
    rollEnd() {

    }
}
