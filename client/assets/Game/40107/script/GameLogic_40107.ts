const MASK_COLOR = 0xF0;
const MASK_VALUE = 0x0F;

enum SAME {
    KING = 0,
    ONE,
    TWO,
    THREE,
    FOUR,
}

export enum TYPE {
    ERROR = 0,            //错误类型
    SINGLE,               //单牌类型
    DOUBLE,               //对牌类型
    THREE,                //三条类型
    SINGLE_LINE,          //单连类型
    DOUBLE_LINE,          //对连类型
    THREE_LINE,           //三连类型
    THREE_TAKE_ONE,       //三带一单
    THREE_TAKE_TWO,       //三带一对
    THREE_LINE_TAKE_ONE,  //飞机带俩单
    THREE_LINE_TAKE_TWO, //飞机带俩对
    FOUR_TAKE_ONE,       //四带两单
    FOUR_TAKE_TWO,       //四带两对
    BOMB,                //炸弹类型
    MISSILE              //火箭类型
}

export default class GameLogic_40107 {

    static _instance: GameLogic_40107 = null;
    public static get instance(): GameLogic_40107 {
        if (this._instance == null) {
            this._instance = new GameLogic_40107();
        }
        return this._instance;
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

    // 小到大排序
    public sortCard(cards: number[]) {
        cards.sort((a, b) => {
            if (this.getLogicValue(a) > this.getLogicValue(b)) return 1;
            else if (this.getLogicValue(a) < this.getLogicValue(b)) return -1;
            else {
                if (a > b) return 1;
                else if (a < b) return -1;
                else return 0;
            }
        });
    }

    // 分析牌, 1234张同牌的数量
    private analyseCard(cardData: number[]): number[][] {
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
                res[SAME.ONE].push(value);
                continue;
            }

            sameCnt = 1;
            for (let j = i + 1; j < cards.length; j++) {
                if (this.getLogicValue(cards[j]) == value) {
                    sameCnt++;
                }
            }
            if (sameCnt > SAME.FOUR) {
                console.log('analyseCard error sameCnt:' + sameCnt);
                return res;
            }
            res[sameCnt].push(value);
            i += sameCnt - 1;
        }
        return res;
    }

    public getCardType(cards: number[]): TYPE {
        if (cards.length == 0) {
            console.log('getCardType error length = 0');
            return TYPE.ERROR;
        } else if (cards.length == 1) return TYPE.SINGLE;

        let res = this.analyseCard(cards);
        if (cards.length == 2) {
            if (res[SAME.KING].length == 2) return TYPE.MISSILE;
            if (res[SAME.TWO].length == 1) return TYPE.DOUBLE;
        }

        if (res[SAME.FOUR].length == 1) {
            if (cards.length == 4) return TYPE.BOMB;
            if (cards.length == 6 && (res[SAME.ONE].length == 2 && res[SAME.KING].length <= 1)) return TYPE.FOUR_TAKE_ONE;
            if (cards.length == 8 && res[SAME.TWO].length == 2) return TYPE.FOUR_TAKE_TWO;
        }

        if (res[SAME.THREE].length == 1) {
            if (cards.length == 3) return TYPE.THREE;
            if (cards.length == 4 && res[SAME.ONE].length == 1) return TYPE.THREE_TAKE_ONE;
            if (cards.length == 5 && res[SAME.TWO].length == 1) return TYPE.THREE_TAKE_TWO;
        }

        let checkLine = (values: number[]) => {
            let first = values[0];
            for (let i = 1; i < values.length; i++) {
                if (first + i != values[i] || first + i > 14) return false;
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

        console.log('getCardType error', cards);
        return TYPE.ERROR;
    }

    getBiggerCard(cardData: number[], currentCard: number[]) {
        let res: number[][] = [];
        // 牌数量比当前牌少
        if (cardData.length < currentCard.length) return res;
        let cards = cardData.slice(0);
        this.sortCard(cards);
        if (currentCard.length > 0) {
            let cur = currentCard.slice(0);
            this.sortCard(cur);
            let type = this.getCardType(cur);
            let analyseCur = this.analyseCard(cur);
            switch (type) {
                case TYPE.SINGLE:
                case TYPE.DOUBLE:
                case TYPE.THREE:
                case TYPE.BOMB: {
                    let result = this.searchSameCard(cards, type == TYPE.BOMB ? 4 : type, this.getLogicValue(cur[0]));
                    res = res.concat(result);
                    break;
                }
                case TYPE.MISSILE: {
                    return [];
                }
                case TYPE.SINGLE_LINE:
                case TYPE.DOUBLE_LINE:
                case TYPE.THREE_LINE: {
                    let same = 0;
                    if (type == TYPE.SINGLE_LINE) same = 1;
                    else if (type == TYPE.DOUBLE_LINE) same = 2;
                    else same = 3;
                    let result = this.searchLine(cards, currentCard.length / same, same, this.getLogicValue(cur[0]));
                    res = res.concat(result);
                    break;
                }
                case TYPE.THREE_TAKE_ONE: {
                    let result = this.searchSameTake(cards, 3, 1, 1, analyseCur[SAME.THREE][0]);
                    res = res.concat(result);
                    break;
                }
                case TYPE.THREE_TAKE_TWO: {
                    let result = this.searchSameTake(cards, 3, 1, 2, analyseCur[SAME.THREE][0]);
                    res = res.concat(result);
                    break;
                }
                case TYPE.FOUR_TAKE_ONE: {
                    let result = this.searchSameTake(cards, 4, 2, 1, analyseCur[SAME.FOUR][0]);
                    res = res.concat(result);
                    break;
                }
                case TYPE.FOUR_TAKE_TWO: {
                    let result = this.searchSameTake(cards, 4, 2, 2, analyseCur[SAME.FOUR][0]);
                    res = res.concat(result);
                    break;
                }
                case TYPE.THREE_LINE_TAKE_ONE: {
                    let result = this.searchThreeLineTake(cards, 1, analyseCur[SAME.THREE].length, analyseCur[SAME.THREE][0]);
                    res = res.concat(result);
                    break;
                }
                case TYPE.THREE_LINE_TAKE_TWO: {
                    let result = this.searchThreeLineTake(cards, 2, analyseCur[SAME.THREE].length, analyseCur[SAME.THREE][0]);
                    res = res.concat(result);
                    break;
                }
            }
            if (type != TYPE.BOMB) {
                let result = this.searchSameCard(cards, 4);
                res = res.concat(result);
            }
            let analyse = this.analyseCard(cards);
            if ((analyse[SAME.KING].length == 2)) {
                res.push(this.getCardsByValue(cards, [16, 17], 1));
            }
            return res;

        } else {
            // 如果最后一手牌能出, 提示一手牌
            let type = this.getCardType(cards);
            if (type != TYPE.ERROR) return [cards];
            let valueCnt = this.analyseValueCnt(cards);
            for (let i = 3; i < valueCnt.length; i++) {
                if (valueCnt[i] > 0) {
                    res.push(this.getCardsByValue(cards, [i], valueCnt[i]));
                }
            }
            return res;
        }
    }

    searchThreeLineTake(cards: number[], takeType: number, lineCnt: number, smallValue: number) {
        let same: number[][] = this.searchLine(cards, lineCnt, 3, smallValue);
        return this._getRemoveTake(cards, same, lineCnt, takeType);
    }

    // takeType 1 单 2 对
    searchSameTake(cards: number[], sameCnt: number, takeCnt: number, takeType: number, smallValue: number) {
        let res: number[][] = [];
        let analyse = this.analyseCard(cards);
        let isFind = false;
        for (let i = sameCnt; i <= SAME.FOUR; i++) {
            analyse[i].forEach(value => {
                if (value > smallValue) isFind = true;
            });
        }
        if (!isFind) return res;
        let same = this.searchSameCard(cards, sameCnt, smallValue);
        return this._getRemoveTake(cards, same, takeCnt, takeType);
    }

    // 删除牌再找单张和对
    _getRemoveTake(cards: number[], removeCard: number[][], takeCnt: number, takeType: number) {
        let res: number[][] = [];
        for (let key of removeCard) {
            let temp = cards.slice(0);
            let tempRes = key.slice(0);
            this.removeCards(temp, tempRes);
            let left = this.searchSameCard(temp, takeType);
            if (left.length < takeCnt) continue;
            for (let j = 0; j < takeCnt; j++) {
                tempRes = tempRes.concat(left[j]);
            }
            res.push(tempRes);
        }
        return res;
    }

    // 优先返回完全符合的牌
    // 返回的同牌要大于smaller
    searchSameCard(cards: number[], sameCnt: number, smallValue?: number) {
        let res: number[][] = [];
        if (sameCnt > SAME.FOUR) {
            console.log('斗地主只有一副牌');
            return res;
        }
        let analyseRes = this.analyseCard(cards);
        for (let i = sameCnt; i < SAME.FOUR + 1; i++) {
            analyseRes[i].forEach(value => {
                if (smallValue == null || value > smallValue) {
                    res.push(this.getCardsByValue(cards, [value], sameCnt));
                }
            });
        }
        return res;
    }

    getCardsByValue(cardData: number[], values: number[], sameCnt): number[] {
        let cards = cardData.slice(0);
        let res: number[] = [];
        for (let v of values) {
            let cnt = sameCnt;
            while (cnt--) {
                for (let i = 0; i < cards.length; i++) {
                    if (this.getLogicValue(cards[i]) == v) {
                        res.push(cards.splice(i, 1)[0]);
                        break;
                    }
                }
            }
        }
        return res;
    }

    searchLine(cards: number[], lineCnt: number, sameCnt: number, smallValue?: number) {
        let res: number[][] = [];
        if (cards.length < lineCnt * sameCnt) return res;
        if (!smallValue) smallValue = 2;
        if (smallValue + lineCnt - 1 > 14) return res;
        let valueCnt = this.analyseValueCnt(cards);
        for (let i = smallValue + 1; i < 15; i++) {
            if (valueCnt[i] >= sameCnt) {
                if (i + lineCnt - 1 > 14) return res;
                let isFind = true;
                let value: number[] = [];
                for (let j = i; j < 15; j++) {
                    if (value.length >= lineCnt) break;
                    if (valueCnt[j] < sameCnt) {
                        isFind = false;
                        break;
                    } else {
                        value.push(j);
                    }
                }
                if (isFind && value.length == lineCnt) {
                    res.push(this.getCardsByValue(cards, value, sameCnt));
                }
            }
        }
        return res;
    }

    //搜索卡牌分步
    analyseValueCnt(cards: number[]) {
        let result: number[] = [];
        for (let i = 0; i <= 17; i++) {
            result[i] = 0;
        }
        for (let i = 0; i < cards.length; i++) {
            let value = this.getLogicValue(cards[i]);
            result[value]++;
        }
        return result;
    }

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
                let resA = this.analyseCard(cardsA);
                let resB = this.analyseCard(cardsB);
                if (typeA == TYPE.FOUR_TAKE_ONE || typeA == TYPE.FOUR_TAKE_TWO) {
                    return (resA[SAME.FOUR][0]) > (resB[SAME.FOUR][0]);
                } else {
                    return (resA[SAME.THREE][0]) > (resB[SAME.THREE][0]);
                }
            }
        }

        console.log('compareCard ' + typeA, cardsA, cardsB);
        return false
    }
}
