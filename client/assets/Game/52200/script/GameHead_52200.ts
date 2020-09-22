import GameHead from "../../Public/script/GameHead";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameHead_52200 extends GameHead {


    onLoad() {
        super.onLoad();
        this.on(['onUserListen']);
    }

    onUserListen({ chair, state }: { chair: number, state: boolean }) {
        if (this.chair != chair) return;
        this.$('_listen').active = state;
    }

    resetView() {
        super.resetView();
        this.$('_listen').active = false;
    }

}
