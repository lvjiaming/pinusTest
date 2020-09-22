import { CHR, IWeaveItem, RULE, WIK } from './define';


interface IKindItem {
    weaveKind: number,
    centerCard: number,
    cardIndex: number[],
    magicCnt: number,
}

interface IAnalyseItem {
    cardEye: number;    //将牌
    weaveKind: number[];
    centerCard: number[];
    cardData: number[][];
    public: boolean[];
    magicEye: boolean;
}


const INVALID_INDEX = -1;
const HONG_ZHONG_INDEX = 31;
const MASK_COLOR = 0xF0;
const MASK_VALUE = 0x0F;
const MAX_WEAVE = 4;
const MAX_COUNT = 14;

export class GameLogic {

    rules: number[] = [];

    magicIndex: number[] = [INVALID_INDEX, INVALID_INDEX];

    hunIndex: number = INVALID_INDEX;

    cardLibrary: number[] = [
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,						// 万子
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,						// 万子
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,						// 万子
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,						// 万子
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						// 索子
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						// 索子
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						// 索子
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						// 索子
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						// 同子
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						// 同子
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						// 同子
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						// 同子
        // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
        // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
        // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
        // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
        0x35, 0x35, 0x35, 0x35
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

    // 返回 max~min 中的随机整数 不包括max 包括min
    public getRandomValue(max: number, min?: number): number {
        if (min === undefined) { min = 0; }
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 洗牌
     */
    public shuffle(): number[] {
        let cards: number[] = [];
        let cardLibrary = this.cardLibrary.slice(0);
        while (cardLibrary.length !== 0) {
            let pos = this.getRandomValue(cardLibrary.length);
            cards.push(cardLibrary.splice(pos, 1)[0]);
        }
        return cards;
    }

    public switchToCardIndex(cardData: number): number;
    public switchToCardIndex(cardData: number[], cardIndex: number[]): void;
    public switchToCardIndex(cardData: number | number[], cardIndex?: number[]) {
        console.log(`cardData: ${cardData}`);
        if (Array.isArray(cardData)) {
            cardData.forEach(card => {
                cardIndex[this.switchToCardIndex(card)]++;
            });
            return;
        } else {
            return (this.getColor(cardData) * 9 + this.getValue(cardData) - 1);
        }
    }

    public switchToCardData(cardIndex: number[]): number[];
    public switchToCardData(cardIndex: number): number;
    public switchToCardData(cardIndex: number | number[]) {
        if (Array.isArray(cardIndex)) {
            let fn = (idx: number) => {
                if (cardIndex[idx] > 0) {
                    for (let j = 0; j < cardIndex[idx]; j++) {
                        cards.push(this.switchToCardData(idx));
                    }
                }
            }
            let cards: number[] = [];
            for (let i = 0; i < cardIndex.length; i++) {
                if (i == this.hunIndex) continue;
                fn(i);
            }
            fn(this.hunIndex);
            return cards;
        } else {
            if (cardIndex < 27) { return ((cardIndex / 9) << 4) | (cardIndex % 9 + 1); }
            else { return (0x30 | (cardIndex - 27 + 1)); }
        }
    }

    public getCardCnt(cardIndex: number[]): number {
        let cnt = 0;
        cardIndex.forEach(cardcnt => cnt += cardcnt);
        return cnt;
    }

    public getRandCard() {
        return this.cardLibrary[this.getRandomValue(this.cardLibrary.length)];
    }

    public addWeave2Index(weaveItem: IWeaveItem[], cardIndex: number[]): void {
        weaveItem.forEach(item => {
            item.cardData.forEach(card => {
                cardIndex[this.switchToCardIndex(card)]++;
            })
        });
    }

    public analyseEatCard(cardIndex: number[], curCard: number): number {
        let idx = this.switchToCardIndex(curCard);
        // 如果是字牌不能吃
        if (idx > 26) return WIK.NULL;
        let res = WIK.NULL;

        let cardIdx = cardIndex.slice(0);
        cardIdx[idx]++;
        let isExit = (start: number) => {
            for (let i = start; i < start + 3; i++) {
                if (this.isMagicIndex(i)) return false;
                if (this.hunIndex == i) return false;
                if (cardIdx[i] == 0) return false;
            }
            return true;
        };
        // 左吃
        if ((idx % 9) < 7) {
            if (isExit(idx)) res |= WIK.LEFT;
        }
        // 右吃
        if ((idx % 9) > 1) {
            if (isExit(idx - 2)) res |= WIK.RIGHT;
        }
        // 中吃
        if (0 < (idx % 9) && (idx % 9) < 8) {
            if (isExit(idx - 1)) res |= WIK.CENTER;
        }
        return res;
    }

    public analysePengCard(cardIndex: number[], curCard: number): boolean {
        let idx = this.switchToCardIndex(curCard);
        if (this.isMagicIndex(idx)) return false;
        if (this.hunIndex == idx) return false;
        return cardIndex[idx] >= 2;
    }

    public analyzeGangCard(cardIndex: number[], curCard: number): number[][];
    public analyzeGangCard(cardIndex: number[], weaveItem: IWeaveItem[]): number[][];
    public analyzeGangCard(cardIndex: number[], weaveItem: IWeaveItem[] | number): number[][] {
        let res: number[][] = [];
        let curCard: number = 0;
        if (typeof weaveItem === "number") {
            curCard = weaveItem;
            weaveItem = [];
        }
        if (!curCard) {
            if (weaveItem) {
                // 补杠
                weaveItem.forEach(item => {
                    if (item.weaveKind == WIK.PENG) {
                        let idx = this.switchToCardIndex(item.centerCard);
                        if (cardIndex[idx] > 0) {
                            res.push([item.centerCard]);
                        }
                    }
                });
            }
            // 暗杠
            for (let ii in cardIndex) {
                let i = parseInt(ii);
                if (this.hunIndex == i) continue;
                if (this.isMagicIndex(i)) continue;
                if (cardIndex[i] >= 4) {
                    let card = this.switchToCardData(i);
                    res.push([0, 0, 0, card]);
                }
            }
        } else {
            // 明杠
            for (let ii in cardIndex) {
                let i = parseInt(ii);
                if (this.hunIndex == i) continue;
                if (this.isMagicIndex(i)) continue;
                if (cardIndex[i] >= 3) {
                    let card = this.switchToCardData(i);
                    if (card == curCard) {
                        res.push([card, card, card, card]);
                    }
                }
            }
        }
        return res;
    }

    // 打哪张上听
    public analyseTingCard(cardIndex: number[], weaveItem: IWeaveItem[]): number[] {
        let res: number[] = [];
        let cnt = this.getCardCnt(cardIndex);
        if (((cnt - 2) % 3) != 0) {
            console.warn('isTingCard error' + cnt);
            return res;
        }
        let cards = cardIndex.slice(0);
        for (let ii in cards) {
            let i = parseInt(ii);
            if (cards[i] > 0) {
                cards[i]--;
                if (this.analyseHuCard(cards, weaveItem, true).length > 0) {
                    res.push(this.switchToCardData(i));
                }
                cards[i]++;
            }
        }
        return res;
    }

    // 胡哪张牌
    // isBreak 如果只是判断有没有要胡的牌 isBreak = true 如果要获取能胡哪些牌isBreak = false
    public analyseHuCard(cardIndex: number[], weaveItem: IWeaveItem[], isBreak?: boolean): number[] {
        let res: number[] = [];
        let cnt = this.getCardCnt(cardIndex);
        if ((cnt - 1) % 3 != 0) {
            console.warn('analyseHuCard error ' + cnt);
            return res;
        }
        for (let i = 0; i < cardIndex.length; i++) {
            let card = this.switchToCardData(i);
            if (CHR.NULL != this.analyseChiHu(cardIndex, weaveItem, card)) {
                res.push(card);
                if (isBreak) break;
            }
        }
        return res;
    }

    public analyseChiHu(cardIndex: number[], weaveItem: IWeaveItem[], currentCard: number): number {
        // console.log("这里的牌信息：", cardIndex, weaveItem, currentCard);
        let chiHuRight = CHR.NULL;
        if (currentCard == 0) {
            console.warn('analyseChiHu error currentCard is 0');
            return chiHuRight;
        }
        if (this.hunIndex == INVALID_INDEX) {
            console.warn('analyseChiHu error hunIndex is INVALID_INDEX');
            return chiHuRight
        }
        let cardIdx = cardIndex.slice(0);

        cardIdx[this.switchToCardIndex(currentCard)]++;

        let allCardIdx = cardIdx.slice(0);
        this.addWeave2Index(weaveItem, allCardIdx);

        if (!this.isOpen(weaveItem)) return chiHuRight;
        if (allCardIdx[this.hunIndex] != 0) return chiHuRight;
        if (!this.check19(allCardIdx)) return chiHuRight;
        if (allCardIdx[HONG_ZHONG_INDEX] == 0 && this.colorCnt(allCardIdx) == 2) return chiHuRight;

        let res = this.analyseCard(cardIdx, weaveItem);
        if (res.length == 0) return chiHuRight;
        if (!this.checkPeng(res)) return chiHuRight;

        let jia = this.isChunJiaOrBaiJia(res, currentCard);
        if (this.isPiao(res)) {
            chiHuRight |= CHR.PIAO;
        } else if (jia == 2) {
            chiHuRight |= CHR.CHUN_JIA;
        } else if (jia == 1) {
            chiHuRight |= CHR.BAI_JIA;
        } else if (this.isDuiDao(res, currentCard)) {
            chiHuRight |= CHR.DUI_DAO;
        } else {
            chiHuRight |= CHR.PI;
        }

        if (this.getCardCnt(cardIdx) == 2) {
            chiHuRight |= CHR.BA_1;
        }
        if (this.colorCnt(allCardIdx) == 1) {
            chiHuRight |= CHR.QING_YI_SE;
        }
        if (this.isDuMen(allCardIdx, currentCard)) {
            chiHuRight |= CHR.DU_MEN;
        }
        return chiHuRight;
    }

    public isOpen(weaveItem: IWeaveItem[]): boolean {
        for (let item of weaveItem) {
            if (item.public) return true;
        }
        return false;
    }

    private check19(cardIndex: number[]): boolean {
        let yaoIndex = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
        for (let idx of yaoIndex) {
            if (cardIndex[idx] > 0) return true;
        }
        return false;
    }

    // 检查是否有暗刻或者碰
    private checkPeng(res: IAnalyseItem[]): boolean {
        for (let item of res) {
            for (let kind of item.weaveKind) {
                if (kind == WIK.PENG || kind == WIK.GANG) return true;
            }
        }
        return false;
    }

    /**
     *  获取花色的数量
     * @param cardIndex
     */
    private colorCnt(cardIndex: number[]): number {
        let cardData = this.switchToCardData(cardIndex);
        let color = [0, 0, 0];
        cardData.forEach(card => {
            let idx = this.getColor(card);
            if (idx < 3) {
                color[idx] = 1;
            }
        });
        return color[0] + color[1] + color[2];
    }

    private isPiao(results: IAnalyseItem[]): boolean {
        for (let res of results) {
            let isPiao = true;
            for (let kind of res.weaveKind) {
                if (kind != WIK.PENG && kind != WIK.GANG) {
                    isPiao = false;
                    break;
                };
            }
            if (isPiao) return true;
        }
        return false;
    }

    //2:纯夹 1:摆夹 0:啥也不是
    private isChunJiaOrBaiJia(results: IAnalyseItem[], curCard: number): number {
        for (let res of results) {
            let card = 0;
            for (let i = 0; i < MAX_WEAVE; i++) {
                let condition37 = (this.getValue(curCard) == 3 && curCard == res.cardData[i][2]) ||
                    (this.getValue(curCard) == 7 && curCard == res.cardData[i][0])
                if (res.weaveKind[i] == WIK.LEFT && res.public[i] == false) {
                    if (curCard == res.cardData[i][1]) {
                        card = res.cardData[i][1];
                        break
                    }
                    if (this._hasRule(RULE.JIA_37) && condition37) {
                        card = res.cardData[i][1];
                        break;
                    }
                }
            }
            if (card) {
                if (res.cardEye == card) return 1;
                for (let i = 0; i < MAX_WEAVE; i++) {
                    if (res.weaveKind[i] == WIK.PENG && res.centerCard[i] == card && res.public[i]) return 1;
                }
                return 2;
            }
        }
        return 0;
    }

    private isDuiDao(results: IAnalyseItem[], curCard: number): boolean {
        for (let res of results) {
            for (let i = 0; i < MAX_WEAVE; i++) {
                if (res.weaveKind[i] == WIK.PENG && res.centerCard[i] == curCard) return true;
            }
        }
        return false;
    }

    private isDuMen(cardIndex: number[], curCard: number): boolean {
        let color = this.colorCnt(cardIndex);
        let cards = cardIndex.slice(0);
        let curIdx = this.switchToCardIndex(curCard);
        if (cards[curIdx] == 2) {
            cards[curIdx] -= 2;
            return (color - this.colorCnt(cards)) == 1;
        }
        return false;
    }



    // all 是否需要获取到胡牌组合, false就只返回一种胡牌组合为节省运算, true返回所有组合(带会慎用)
    private analyseCard(cardIndex: number[], weaveItem: IWeaveItem[], all?: boolean): IAnalyseItem[] {
        let result: IAnalyseItem[] = [];
        // 手牌数量
        let cardCnt = this.getCardCnt(cardIndex);
        if ((cardCnt - 2) % 3 != 0 || cardCnt < 2 || cardCnt > MAX_COUNT) {
            console.warn('analyseCard error ' + cardCnt);
            console.assert(false);
            return result;
        }
        // 手牌中会牌数量
        let magicCnt = this.getMagicCnt(cardIndex);

        // 手牌中全是会 这里不做处理请在上层处理
        if (cardCnt == magicCnt) {
            console.warn('analyseCard error 剩余手牌全是会');
            return result;
        }

        // 将weaveItem放入结果集中
        let pushWeaveItem = (res: IAnalyseItem) => {
            if (!res.cardData) res.cardData = [];
            if (!res.centerCard) res.centerCard = [];
            if (!res.weaveKind) res.weaveKind = [];
            if (!res.public) res.public = [];
            for (let i in weaveItem) {
                res.cardData[i] = weaveItem[i].cardData;
                res.centerCard[i] = weaveItem[i].centerCard;
                res.weaveKind[i] = weaveItem[i].weaveKind;
                res.public[i] = true;
            }
        }

        // 返回碰kindItem
        let pengKind = (cnt: number, idx: number): IKindItem => {
            let index: number[];
            if (cnt > 2) index = [idx, idx, idx];
            else if (cnt > 1) index = [idx, idx];
            else index = [idx];
            return {
                weaveKind: WIK.PENG,
                centerCard: this.switchToCardData(idx),
                cardIndex: index,
                magicCnt: 3 - index.length
            } as IKindItem;
        }

        // callback排列组合的, callback 返回值可以跳出循环, 神代码, 我是没看懂, 有大神看懂了给我讲讲,
        // eg setIndex(2, 3, call) call([0,1]) call([0,2]) call([1,2]) 
        let setIndex = (subCnt: number, allCnt: number, callback: (res: number[]) => boolean) => {
            let index: number[] = [];
            for (let i = 0; i < subCnt; i++) {
                index.push(i);
            }
            do {
                if (callback(index)) break;
                //设置索引
                if (index[subCnt - 1] == (allCnt - 1)) {
                    let i = subCnt - 1;
                    for (; i > 0; i--) {
                        if ((index[i - 1] + 1) != index[i]) {
                            let newIndex = index[i - 1];
                            for (let j = (i - 1); j < subCnt; j++)
                                index[j] = newIndex + j - i + 2;
                            break;
                        }
                    }
                    if (i == 0)
                        break;
                } else
                    index[subCnt - 1]++;
            } while (true);
        }


        if (cardCnt == 2) {
            for (var i in cardIndex) {
                // 如果手中两张牌相同或者一张会牌一张非会牌则胡牌
                if (cardIndex[i] == 2 || (cardIndex[i] == 1 && magicCnt == 1)) {
                    let res = <IAnalyseItem>{
                        cardEye: this.switchToCardData(parseInt(i)),
                        magicEye: magicCnt > 0,
                    };
                    pushWeaveItem(res);
                    result.push(res);
                    return result;
                }
            }
            return result;
        } else {
            // 将所有暗刻牌和连牌组合可能找出 放入kinds中
            let kinds: IKindItem[] = [];
            let lessKindCnt = (cardCnt - 2) / 3;
            for (let ii in cardIndex) {
                let i = parseInt(ii);
                if (this.isMagicIndex(i)) continue;
                // 暗刻判断
                if (cardIndex[i] >= 3 || cardIndex[i] + magicCnt >= 3) {
                    let tempCardCnt = cardIndex[i];
                    do {
                        kinds.push(pengKind(tempCardCnt, i));
                        if (tempCardCnt >= 3 && magicCnt > 0) {
                            kinds.push(pengKind(2, i));
                            if (magicCnt > 1) {
                                kinds.push(pengKind(1, i));
                            }
                        }
                        tempCardCnt -= 3;
                        if (tempCardCnt == 0) break;
                    } while (tempCardCnt + magicCnt >= 3);
                }
                // 连牌判断
                // 3 * 9 - 2 = 25
                if (i < 25 && (i % 9) < 7) {
                    if (cardIndex[i] + cardIndex[i + 1] + cardIndex[i + 2] + magicCnt >= 3) {
                        let index = [cardIndex[i], cardIndex[i + 1], cardIndex[i + 2]];
                        let cnt = index[0] + index[1] + index[2];
                        // 当连牌中只有一张不处理, 因为可以组成暗刻牌
                        if (cnt == 0 || (cnt == 1 && !all)) continue;
                        let tempMagicCnt = magicCnt;
                        while (tempMagicCnt + index[0] + index[1] + index[2] >= 3) {
                            let useIndex = [];
                            for (let j = 0; j < 3; j++) {
                                if (index[j] > 0) {
                                    index[j]--;
                                    useIndex.push(i + j);
                                } else {
                                    tempMagicCnt--;
                                }
                            }
                            if (tempMagicCnt >= 0) {
                                kinds.push({
                                    weaveKind: WIK.LEFT,
                                    centerCard: this.switchToCardData(i),
                                    cardIndex: useIndex,
                                    magicCnt: 3 - useIndex.length
                                });
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
            if (lessKindCnt > kinds.length) return result;
            // 找出和当前手牌一致的组合
            setIndex(lessKindCnt, kinds.length, (index: number[]) => {
                let tempMagicCnt = 0;
                index.forEach(idx => {
                    tempMagicCnt += kinds[idx].magicCnt;
                });
                // 会牌校验
                if (tempMagicCnt > magicCnt || magicCnt - tempMagicCnt >= 2) return false;

                let tempCardIdx = cardIndex.slice(0);
                for (let idx of index) {
                    for (let idxCard of kinds[idx].cardIndex) {
                        if (tempCardIdx[idxCard] == 0) return false;
                        else tempCardIdx[idxCard]--;
                    }
                }
                if (this.getCardCnt(tempCardIdx) != 2) return false;
                let leftMagicCnt = this.getMagicCnt(tempCardIdx);
                for (let ii in tempCardIdx) {
                    let i = parseInt(ii);
                    if (this.isMagicIndex(i)) continue;
                    if (tempCardIdx[i] == 2 || (tempCardIdx[i] == 1 && leftMagicCnt == 1)) {
                        let res = <IAnalyseItem>{
                            cardEye: this.switchToCardData(i),
                            magicEye: tempCardIdx[i] == 1
                        }
                        pushWeaveItem(res);
                        index.forEach(idx => {
                            let resIndex = res.centerCard.length;
                            kinds[idx].cardIndex.forEach(idx => {
                                if (!res.cardData[resIndex]) res.cardData[resIndex] = [];
                                res.cardData[resIndex][res.cardData[resIndex].length] = this.switchToCardData(idx);
                            });
                            res.centerCard[resIndex] = kinds[idx].centerCard;
                            res.weaveKind[resIndex] = kinds[idx].weaveKind;
                            res.public[resIndex] = false;
                        });
                        result.push(res);
                        return !!all;
                    }
                }
                return false;
            })

        }
        return result;
    }

    public getWeaveCard(weaveKind: number, centerCard: number): number[] {
        switch (weaveKind) {
            case WIK.LEFT: return [centerCard, centerCard + 1, centerCard + 2];
            case WIK.CENTER: return [centerCard - 1, centerCard, centerCard + 1];
            case WIK.RIGHT: return [centerCard - 2, centerCard - 1, centerCard];
            case WIK.PENG: return [centerCard, centerCard, centerCard];
            case WIK.GANG: return [centerCard, centerCard, centerCard, centerCard];
            default: {
                console.warn('getWeaveCard error ' + weaveKind);
                return [];
            }
        }
    }

    public getMagicCnt(cardIndex: number[]) {
        let cnt = 0;
        this.magicIndex.forEach(idx => {
            if (cardIndex[idx]) {
                cnt + cardIndex[idx];
            }
        })
        return cnt;
    }

    public isMagicIndex(idx: number): boolean {
        for (let index of this.magicIndex) {
            if (index == idx) return true;
        }
        return false;
    }

}
