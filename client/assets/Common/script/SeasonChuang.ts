import CustomSprite from "./CustomSprite";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SeasonChuang extends CustomSprite {

    list:number[] = [3, 3, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3];

    onLoad () {
        let month = (new Date()).getMonth();
        this.index = this.list[month];
    }
}
