import CustomSprite from "../../../Common/script/CustomSprite";
import GameHead from "../../Public/script/GameHead";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameHead_52200 extends GameHead {

    onLoad() {
        super.onLoad();
        this.on(['onCurrentUser', 'onSureBank', 'onUpdateHandCnt', 'onOpRes']);
    }

    onCurrentUser(data: { chair: number }) {
        this.$('_cur').active = this.chair == data.chair;
    }

    onSureBank(data: { bankUser: number }) {
        this.isBanker = data.bankUser == this.chair;
    }

    onUpdateHandCnt(cnt: number[]) {
        if (cnt[this.chair] <= 3) {
            this.$('_warn').active = true;
        }
        if (this.chair == vv.gameClient.meChairID) return;
        this.$('_labCardCnt', cc.Label).string = cnt[this.chair] + '';
    }

    onOpRes(data: { chair: number, state: number}) {
        if (data.chair != this.chair) return;
        if (vv.replay && vv.replay.isReturn) return;
        vv.audio.playEffect(vv.gameClient.getGender(data.chair) +  'OP' + data.state);
        // 跳过明牌
        if (data.state == 7) return;
        this.$('_state', CustomSprite).index = data.state;
        this.$('_state').active = true;
        this.scheduleOnce(()=> {
            this.$('_state').active = false;
        }, 1);
    }

    resetView() {
        super.resetView();
        if (this.$('_labCardCnt')) {
            this.$('_labCardCnt', cc.Label).string = '0';   
        }
        this.isBanker = false;
        this.$('_warn').active = false;
    }
}
