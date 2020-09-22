import CustomSlider from "../../Common/script/CustomSlider";
import CreateRoom from "../../Hall/script/CreateRoom";
import { SERVER_RULE } from './../../Hall/script/CreateRoom';

const { ccclass, property } = cc._decorator;

@ccclass
export default class CreateClubRoom extends CreateRoom {


    async _onBtCreate() {
        var route = 'hall.roomHandler.createRoom';
        var rule = this._getRule(this.m_KindID + '');
        var msg: ICreateRoom = {
            UserID: vv.userInfo.UserID,
            ClubKey: vv.club.clubInfo.ClubKey,
            KindID: this.m_KindID,
            ServerRules: rule.server |
                SERVER_RULE.CREATE_ROOMCARD |
                SERVER_RULE.GAME_ROOM |
                SERVER_RULE.PAY_CREATOR |
                SERVER_RULE.AGENCY_CREATE,
            GameRules: rule.game
        };
        msg.GameRules[1] = parseInt(this.$('_labCost' + this.m_KindID, cc.Label).string);
        // 保存规则
        this.m_bClick = true;
        var res = await vv.pinus.request(route, msg);
        if (res.status != 0) {
            this.showAlert(res.msg);
            return;
        }
        vv.roomInfo = res.data;
        cc.director.loadScene(vv.roomInfo.KindID + '');
    }

    onSlider(event: CustomSlider) {
        this.$('_labCost' + this.m_KindID, cc.Label).string = (Math.round(event.progress * 9) + 1) + '';
    }

}
