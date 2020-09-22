import ActionClass from "../../Common/script/ActionClass";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ClubCreate extends ActionClass {

    isClick: boolean = false;

    async _onBtCreate() {
        if (this.isClick) return;
        this.isClick = true;
        let name = this.$('_editName', cc.EditBox).string;
        if (name == '') {
            this.showTips('请输入俱乐部名称!');
            return;
        }
        let res: IResponse = await vv.pinus.request('hall.hallClubHandler.createClub', {
            name: name
        });
        if (res.status == 0) {
            this.showAlert(res.msg, Alert.Yes, () => {
                this.$('_editName', cc.EditBox).string = '';
                this.node.active = false;
                this.m_Hook.node.active = false;
                this.isClick = false;
            })
        } else {
            this.showAlert(res.msg, Alert.Yes, ()=> {
                this.isClick = false;
            });
        }
    }
}
