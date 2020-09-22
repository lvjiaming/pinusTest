import BaseClass from "../../../Common/script/BaseClass";
import ThirdParty from "../../../Common/script/ThirdParty";
import UIKillerClass from "../../../Common/script/UIKillerClass";
import UserCtrl from "../../../Common/script/UserCtrl";
import HandCtrl from "../../Mahjong/script/HandCtrl";
import MJCard from "../../Mahjong/script/MJCard";
import WeaveCtrl from "../../Mahjong/script/WeaveCtrl";
import GameView from "../../Public/script/GameView";
import { IGameConclude } from './GameClient_52200';

const { ccclass, property } = cc._decorator;


// 胡牌权位
var CHR = {
    NULL: 0x00000000,
    PI: 0x00000001,
    PIAO: 0x00000002,
    CHUN_JIA: 0x00000004,
    BAI_JIA: 0x00000008,
    GANG_KAI: 0x00000010,
    LIU_LEI: 0x00000020,
    BA_1: 0x00000040,
    QING_YI_SE: 0x00000080,
    MEN_DA_3: 0x00000100,
    DU_MEN: 0x00000200,
    DUI_DAO: 0x00000400
}

@ccclass
export default class GameEnd_52200 extends BaseClass {

    @property(cc.Node)
    layout: cc.Node = null;

    onLoad() {
        this.on(['onGameStart']);
    }

    onGameStart() {
        this.node.active = false;
    }

    onGameConclude(data: IGameConclude) {
        this.$('_btShare').active = cc.sys.isNative;
        this.node.active = true;
        this.$('_hunCard', MJCard).card = data.hunCard;
        this.$('_labMyScore', cc.Label).string = vv.gameClient.sitUser[vv.gameClient.meChairID].Score + '';
        let index = 0;
        let win = -1;
        this.layout.children.forEach(node => node.active = false);
        for (let i = 0; i < data.playerStatus.length; i++) {
            if (!data.playerStatus[i]) continue;
            if (data.chiHuRight[i] != 0) win = i;
        }
        for (let i = 0; i < data.playerStatus.length; i++) {
            if (!data.playerStatus[i]) continue;
            let js = this._getItem(index++);
            js.$('_userInfo', UserCtrl).setUserByID(vv.gameClient.sitUser[i].UserInfo.UserID);
            js.$('_bg').active = !!data.chiHuRight[i];
            js.$('_hu').active = !!data.chiHuRight[i];
            js.$('_dianPao').active = (i == data.provider && !data.chiHuRight[i] && win != -1);
            js.$('_labScore', cc.Label).string = data.score[i] + '';
            js.$('_WeaveCtrl', WeaveCtrl).setWeaveItems(data.weaveItem[i]);
            js.$('_HandCtrl').active = true;
            js.$('_HandCtrl', HandCtrl).allCards.forEach(card => card.scale = 0.7);
            js.$('_HandCtrl', HandCtrl).setCards(data.handCard[i], data.chiHuRight[i] ? data.providCard : data.splitCard[i]);
            let str = (i == data.provider && !data.chiHuRight[i] && (data.chiHuRight[win] & CHR.LIU_LEI) > 0) ? '流泪 ' : '';
            if (i == data.provider && data.chiHuRight[i] != 0) str += '自摸 ';
            str += this._getString(data.chiHuRight[i]);
            if (data.chiHuRight[i] != 0 && data.outHunCnt[i] != 0) {
                str += '打混X' + data.outHunCnt[i] + ' ';
            }
            js.$('_labDesc', cc.Label).string = str;
            js.$('_bank').active = i == data.bankUser;
        }
        let meScore = data.score[vv.gameClient.meChairID];
        if (meScore != 0) {
            vv.audio.playEffect(meScore > 0 ? 'win' : 'lose');
        }
    }

    private _getItem(idx: number): UIKillerClass {
        let node = this.layout.children[idx] || cc.instantiate(this.layout.children[0]);
        node.parent = this.layout;
        node.active = true;
        return node.getComponent(UIKillerClass);
    }

    private _getString(chiHuRight: number) {
        if (chiHuRight == 0) return '';
        let hasRule = (rule: number) => {
            return (chiHuRight & rule) > 0;
        };
        let str = '';
        let list1: [number, string][] = [
            [CHR.PIAO, '飘 '],
            [CHR.CHUN_JIA, '纯夹 '],
            [CHR.BAI_JIA, '摆夹 '],
            [CHR.DUI_DAO, '对倒 '],
            [CHR.PI, '平胡 '],
        ];
        let list2: [number, string][] = [
            [CHR.GANG_KAI, '杠开 '],
            [CHR.BA_1, '手把一 '],
            [CHR.QING_YI_SE, '清一色 '],
            [CHR.MEN_DA_3, '站三家 '],
            [CHR.DU_MEN, '独门 '],
        ];
        for (let i in list1) {
            if (hasRule(list1[i][0])) {
                str = list1[i][1];
                break;
            }
        }
        for (let i in list2) {
            if (hasRule(list2[i][0])) {
                str += list2[i][1];
            }
        }
        return str;
    }

    _onBtContinue() {
        let gameView: GameView = vv.gameClient.gameView;
        this.node.active = false;
        gameView._onBtReady();
    }

    _onBtShare() {
        ThirdParty.WXShareImage(ThirdParty.saveImage(this.node));
    }

}
