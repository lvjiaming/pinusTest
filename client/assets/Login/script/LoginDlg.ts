const { ccclass, property } = cc._decorator;
import BaseClass from "../../Common/script/BaseClass";
import Login from "./Login";


@ccclass
export default class LoginDlg extends BaseClass {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    m_Hook: Login;

    start() {

    }

    public async onShowView() {
        const acc = cc.sys.localStorage.getItem(GAME_NAME + 'userAcc');
        const psw = cc.sys.localStorage.getItem(GAME_NAME + 'userPsw');
        if (acc) {
            this.$('_editAcc', cc.EditBox).string = acc;
            this.$('_editPsw', cc.EditBox).string = psw
        }
    }

    private async _onBtLogin() {
        const accPsw: { acc: string, psw: string } = this._getAccPswObj();
        if (accPsw.acc == '') {
            this.showTips('请输入账号');
            return;
        }
        await this.m_Hook.loginAccount(accPsw.acc, this.$('_editPsw', cc.EditBox).string);
    }

    private async _onBtRegist() {
        if (this.$('_editAcc', cc.EditBox).string == '') {
            this.showTips('请输入账号');
            return;
        }
        const route = 'connector.loginHandler.registAccount';
        const res: IResponse = await vv.pinus.request(route, this._getAccPswObj());
        this.showAlert(res.msg);
    }

    private _getAccPswObj() {
        return {
            acc: this.$('_editAcc', cc.EditBox).string,
            psw: vv.md5(this.$('_editPsw', cc.EditBox).string)
        }
    }

    // update (dt) {}
}
