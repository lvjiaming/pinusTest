import { RULE, TYPE } from "./define";


const MASK_COLOR = 0xF0;
const MASK_VALUE = 0x0F;

enum SAME {
    KING = 0,
    ONE,
    TWO,
    THREE,
    FOUR,
}


export class GameLogic {

    rules: number[] = [];

    cardLibrary: number[] = [
        0x01, 0x02, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D,	//方块 A - K
        0x11, 0x12, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D,	//梅花 A - K
        0x21, 0x22, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D,	//红桃 A - K
        0x31, 0x32, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D,	//黑桃 A - K
        0x4E, 0x4F,
        0x03, 0x04, 0x05,
        0x13, 0x14, 0x15,
        0x23, 0x24, 0x25,
        0x33, 0x34, 0x35,
    ];

    constructor() {
    }

    public setRules(rules: number[]) {
        this.rules = rules;
    }

    private _hasRule(rule: number) {
        return (this.rules[0] & rule) > 0;
    }

    public getColor(cardData: number) {
        return (cardData & MASK_COLOR) >> 4;
    }

    public getValue(cardData: number) {
        return (cardData & MASK_VALUE);
    }

    public getLogicValue(card: number) {
        let value = this.getValue(card);
        let color = this.getColor(card);
        if (color == 4) return value + 2;
        else return value <= 2 ? (value + 13) : value;
    }

    // 返回 max~min 中的随机整数 不包括max 包括min
    public getRandomValue(max: number, min?: number): number {
        if (min === undefined) {
            min = 0;
        }
        return Math.floor(Math.random() * (max - min)) + min;
    }

    public shuffle(): number[] {
        let cards: number[] = [];
        let cardLibrary = this.cardLibrary.slice(0);
        if (this._hasRule(RULE.NO_345)) {
            cardLibrary = cardLibrary.slice(0, -12);
        }
        while (cardLibrary.length !== 0) {
            let pos = this.getRandomValue(cardLibrary.length);
            cards.push(cardLibrary.splice(pos, 1)[0]);
        }
        return cards;
    }

    // 判断是否有4个2或者俩王
    public checkGoodCard(cards: number[]): boolean {
        if (!this._hasRule(RULE.GOOD_CALL)) return false;
        let cnt2 = 0, kingCnt = 0;
        cards.forEach(card => {
            if (this.getValue(card) == 2) cnt2++;
            if (this.getColor(card) == 4) kingCnt++;
        });
        return cnt2 == 4 || kingCnt == 2;
    }

    public getCardType(cards: number[]): TYPE {
        if (cards.length == 0) {
            console.log('getCardType error length = 0');
            return TYPE.ERROR;
        } else if (cards.length == 1) return TYPE.SINGLE;

        let res = this.analyzeCard(cards);
        if (cards.length == 2) {
            if (res[SAME.KING].length == 2) return TYPE.MISSILE;
            if (res[SAME.TWO].length == 1) return TYPE.DOUBLE;
        }

        if (res[SAME.FOUR].length == 1) {
            if (cards.length == 4) return TYPE.BOMB;
            if (cards.length == 6 && (res[SAME.ONE].length == 2 ||
                (res[SAME.ONE].length == 1 && res[SAME.KING].length == 1))) return TYPE.FOUR_TAKE_ONE;
            if (cards.length == 8 && res[SAME.TWO].length == 2) return TYPE.FOUR_TAKE_TWO;
        }

        if (res[SAME.THREE].length == 1) {
            if (cards.length == 3) return TYPE.THREE;
            if (cards.length == 4 && (res[SAME.ONE].length == 1 || res[SAME.KING].length == 1)) return TYPE.THREE_TAKE_ONE;
            if (cards.length == 5 && res[SAME.TWO].length == 1) return TYPE.THREE_TAKE_TWO;
        }

        let checkLine = (values: number[]) => {
            let first = values[0];
            if (first > 14) return false;
            for (let i = 1; i < values.length; i++) {
                if (first - i != values[i]) return false;
            }
            return true;
        };

        if (res[SAME.THREE].length > 1 && checkLine(res[SAME.THREE])) {
            if (cards.length == (res[SAME.THREE].length * 3)) return TYPE.THREE_LINE;
            if (res[SAME.TWO].length == res[SAME.THREE].length &&
                cards.length == (res[SAME.THREE].length * 3 + res[SAME.TWO].length * 2)) return TYPE.THREE_LINE_TAKE_TWO;
            if (res[SAME.ONE].length == res[SAME.THREE].length &&
                cards.length == (res[SAME.THREE].length * 3 + res[SAME.ONE].length)) return TYPE.THREE_LINE_TAKE_ONE;
        }

        if (res[SAME.ONE].length >= 5 && checkLine(res[SAME.ONE]) &&
            res[SAME.ONE].length == cards.length) return TYPE.SINGLE_LINE;

        if (res[SAME.TWO].length >= 3 && checkLine(res[SAME.TWO]) &&
            cards.length == 2 * res[SAME.TWO].length) return TYPE.DOUBLE_LINE;

        if (res[SAME.THREE].length >= 3 && checkLine(res[SAME.THREE]) &&
            cards.length == 3 * res[SAME.THREE].length) return TYPE.THREE_LINE;

        console.log('getCardType error', cards);
        return TYPE.ERROR;
    }

    // 大到小排序
    public sortCard(cards: number[]) {
        cards.sort((a, b) => {
            if (this.getLogicValue(a) < this.getLogicValue(b)) return 1;
            else if (this.getLogicValue(a) > this.getLogicValue(b)) return -1;
            else {
                if (a < b) return 1;
                else if (a > b) return -1;
                else return 0;
            }
        });
    }

    // 分析牌, 1234张同牌的数量
    private analyzeCard(cardData: number[]): number[][] {
        let res: number[][] = [];
        for (let i = SAME.KING; i <= SAME.FOUR; i++) {
            res[i] = [];
        }
        let sameCnt = 0;
        let cards = cardData.slice(0);
        this.sortCard(cards);
        for (let i = 0; i < cards.length; i++) {
            if (cards[i] == 0) continue;

            let value = this.getLogicValue(cards[i]);
            if (this.getColor(cards[i]) == 4) {
                res[SAME.KING].push(value);
                continue;
            }

            sameCnt = 1;
            for (let j = i + 1; j < cards.length; j++) {
                if (this.getLogicValue(cards[j]) == value) {
                    sameCnt++;
                }
            }
            if (sameCnt > SAME.FOUR) {
                console.log('analyzeCard error sameCnt:' + sameCnt);
                return res;
            }
            res[sameCnt].push(value);
            i += sameCnt - 1;
        }
        return res;
    }

    // true A 大 false B 大
    public compareCard(cardsA: number[], cardsB: number[]): boolean {
        let typeA = this.getCardType(cardsA);
        let typeB = this.getCardType(cardsB);
        if (typeA == TYPE.MISSILE) return true;
        if (typeB == TYPE.MISSILE) return false;

        if (typeA != typeB) {
            if (typeA == TYPE.BOMB) return true;
            if (typeB == TYPE.BOMB) return false;
            console.log('compareCard type error', cardsA, cardsB);
            return false;
        }

        if (cardsA.length != cardsB.length) {
            console.log('compareCard length error', cardsA, cardsB);
            return false;
        }

        switch (typeA) {
            case TYPE.SINGLE:
            case TYPE.DOUBLE:
            case TYPE.THREE:
            case TYPE.SINGLE_LINE:
            case TYPE.DOUBLE_LINE:
            case TYPE.THREE_LINE:
            case TYPE.BOMB: {
                return this.getLogicValue(cardsA[0]) > this.getLogicValue(cardsB[0]);
            }
            case TYPE.THREE_TAKE_ONE:
            case TYPE.THREE_TAKE_TWO:
            case TYPE.FOUR_TAKE_ONE:
            case TYPE.FOUR_TAKE_TWO:
            case TYPE.THREE_LINE_TAKE_ONE:
            case TYPE.THREE_LINE_TAKE_TWO: {
                let resA = this.analyzeCard(cardsA);
                let resB = this.analyzeCard(cardsB);
                if (typeA == TYPE.FOUR_TAKE_ONE || typeA == TYPE.FOUR_TAKE_TWO) {
                    return this.getLogicValue(resA[SAME.FOUR][0]) > this.getLogicValue(resB[SAME.FOUR][0]);
                } else {
                    return this.getLogicValue(resA[SAME.THREE][0]) > this.getLogicValue(resB[SAME.THREE][0]);
                }
            }
        }

        console.log('compareCard ' + typeA, cardsA, cardsB);
        return false
    }

    // A-B 改变 A, 返回true成功 返回false失败
    public removeCards(cardsA: number[], cardsB: number[]): boolean {
        for (let i in cardsB) {
            let isFind = false;
            for (let j = 0; j < cardsA.length; j++) {
                if (cardsA[j] == cardsB[i]) {
                    isFind = true;
                    cardsA.splice(j, 1);
                    break;
                }
            }
            if (!isFind) {
                console.trace('removeCards error', cardsA, cardsB);
                return false;
            }
        }
        return true;
    }

}
