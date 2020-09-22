import { GAME_PLAYER } from "../../Public/script/GameClient";
import { DIR } from "./MJCard";
import WeaveCard, { ARROW } from "./WeaveCard";

const { ccclass, property } = cc._decorator;

export interface IWeaveItem {
    weaveKind: number;
    centerCard: number;
    public: boolean;
    provider: number;
    cardData: number[];
    // 特殊 当开门时暗杠需要给其他人看到
    show: boolean;
}

export const WIK = {
    NULL: 0x0000,
    LEFT: 0x0001,
    CENTER: 0x0002,
    RIGHT: 0x0004,
    PENG: 0x0008,
    GANG: 0x0010,
    LISTEN: 0x0020,
    CHI_HU: 0x0040,
};
const CARD_CNT = 4;
const SPACE_X = -2;
const SPACE_Y = -20;
// 2.5D
const OFFSET = 4;

@ccclass
export default class WeaveItem extends cc.Component {

    // 提供牌的人的位置减去当前玩家位置, 差值为索引, 用来显示箭头方向
    _arrowShow: number[] = [ARROW.NULL, ARROW.RIGHT, ARROW.UP, ARROW.LEFT];

    @property(WeaveCard)
    cards: WeaveCard[] = [];
    @property(cc.Layout)
    layout: cc.Layout = null;

    _direction: DIR = DIR.DOWN;
    @property({ type: cc.Enum(DIR) })
    set direction(value: DIR) {
        this._direction = value;
        let horOrVer = (value == DIR.DOWN || value == DIR.UP)
        this.layout.type = horOrVer ? cc.Layout.Type.HORIZONTAL : cc.Layout.Type.VERTICAL;
        this.layout.spacingX = horOrVer ? SPACE_X : 0;
        this.layout.spacingY = horOrVer ? 0 : SPACE_Y;
        this.cards.forEach(card => {
            card.direction = value;
            card.scale = (DIR.UP == value) ? 0.6 : 1;
        });
        for (let i = 0; i < 3; i++) {
            if (horOrVer) {
                this.cards[i].node.y = 0;
            } else if (value == DIR.LEFT) {
                this.cards[i].node.x = OFFSET - i * OFFSET;
            } else {
                this.cards[i].node.x = i * OFFSET - OFFSET;
            }
        }
        this.cards[3].node.y = horOrVer ? 22 : 18;
        if (horOrVer) {
            this.cards[3].node.x = 0;
        } else if (value == DIR.LEFT) {
            this.cards[3].node.x = -1;
        } else {
            this.cards[3].node.x = 1;
        }
        this.layout.updateLayout();
        this.node.width = this.layout.node.width;
        this.node.height = this.layout.node.height;
    }

    get direction() {
        return this._direction;
    }

    // 0 为顺序 1 为中心牌在中间
    type: number = 1;

    meChairID: number = -1;

    public setWeave(weaveItem: IWeaveItem) {
        if (weaveItem.cardData.length < 3) {
            console.warn("WeaveItem setCards error ", weaveItem.cardData);
            return;
        }

        this.cards[3].node.active = !!weaveItem.cardData[3];
        weaveItem.cardData = this._sortCard(weaveItem.cardData, weaveItem.centerCard);

        for (let i in weaveItem.cardData) {
            this.cards[i].card = (!weaveItem.public && parseInt(i) < 3) ? 0 : weaveItem.cardData[i];
            if (!weaveItem.show && (!weaveItem.public && parseInt(i) == 3 &&
                (this.meChairID != -1 && vv.gameClient.meChairID != this.meChairID))) {
                this.cards[i].card = 0;
            }
        }

        let centerIdx = this._getCenterIdx(weaveItem);
        let arrDir = this._arrowShow[(weaveItem.provider + vv.gameClient.getMaxPlayer() - this.meChairID) % GAME_PLAYER];
        if (this.meChairID == -1) arrDir = ARROW.NULL;
        for (let i = 0; i < CARD_CNT; i++) {
            if (i == centerIdx) {
                this.cards[i].isGray = arrDir != ARROW.NULL;
                if (arrDir && arrDir != ARROW.NULL) {
                    this.cards[i].arrowDir = arrDir;
                }
            } else {
                this.cards[i].isGray = false;
                this.cards[i].arrowDir = ARROW.NULL;
            }
        }
    }

    public setCards(cardData: number[], centerCard: number, actionMask: number) {
        for (let i in this.cards) {
            this.cards[i].node.active = cardData[i] != null;
            if (cardData[i] == null) continue;
            this.cards[i].card = cardData[i];
            this.cards[i].isGray = (actionMask & (WIK.LEFT | WIK.RIGHT | WIK.CENTER) && cardData[i] == centerCard);
        }
    }

    private _getCenterIdx(weaveItem: IWeaveItem) {
        if (weaveItem.weaveKind & (WIK.LEFT | WIK.CENTER | WIK.RIGHT)) {
            for (let i in weaveItem.cardData) {
                if (weaveItem.cardData[i] == weaveItem.centerCard) {
                    return parseInt(i);
                }
            }
        } else if (weaveItem.weaveKind == WIK.PENG) {
            return 1;
        } else if (weaveItem.weaveKind == WIK.GANG) {
            return 3;
        }
        return -1;
    }

    private _sortCard(cardData: number[], centerCard: number) {
        var card = cardData.slice(0);
        card.sort((a, b) => {
            if (a > b) return 1;
            else if (a < b) return -1;
            else return 0;
        });
        if (this.type == 1) {
            for (var i in card) {
                if (card[i] == centerCard) {
                    if (parseInt(i) == 1) break;
                    var temp = card[i];
                    card[i] = card[1];
                    card[1] = temp;
                    break;
                }
            }
        }
        return card;
    }


}
