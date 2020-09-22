import ActionClass from "../../Common/script/ActionClass";


const {ccclass, property} = cc._decorator;

@ccclass
export default class CustomerService extends ActionClass {


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // update (dt) {}

    public async onShowView() {
        var route = 'hall.hallHandler.getKfWechats';
        var res = await vv.pinus.request(route, {});
        this.$('_labMsg', cc.Label).string = res.status ? res.msg : res.data;
    }

    _onBtOK() {
        this.hideView();
    }
}
