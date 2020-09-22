import ActionClass from "../../Common/script/ActionClass";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ClubWelcome extends ActionClass {

    onLoad() {
        this.node.zIndex = 10;
    }

    _onBtCreate() {
        this.showPrefab('ClubCreate');
    }

    _onBtJoin() {
        this.showPrefab('ClubJoin');        
    }
}
