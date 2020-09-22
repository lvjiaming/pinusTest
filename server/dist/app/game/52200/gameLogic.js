"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLogic = void 0;
const define_1 = require("./define");
const INVALID_INDEX = -1;
const HONG_ZHONG_INDEX = 31;
const MASK_COLOR = 0xF0;
const MASK_VALUE = 0x0F;
const MAX_WEAVE = 4;
const MAX_COUNT = 14;
class GameLogic {
    constructor() {
        this.rules = [];
        this.magicIndex = [INVALID_INDEX, INVALID_INDEX];
        this.hunIndex = INVALID_INDEX;
        this.cardLibrary = [
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,
            // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
            // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
            // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
            // 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
            0x35, 0x35, 0x35, 0x35
        ];
    }
    setRules(rules) {
        this.rules = rules;
    }
    _hasRule(rule) {
        return (this.rules[0] & rule) > 0;
    }
    getColor(cardData) {
        return (cardData & MASK_COLOR) >> 4;
    }
    getValue(cardData) {
        return (cardData & MASK_VALUE);
    }
    // 返回 max~min 中的随机整数 不包括max 包括min
    getRandomValue(max, min) {
        if (min === undefined) {
            min = 0;
        }
        return Math.floor(Math.random() * (max - min)) + min;
    }
    /**
     * 洗牌
     */
    shuffle() {
        let cards = [];
        let cardLibrary = this.cardLibrary.slice(0);
        while (cardLibrary.length !== 0) {
            let pos = this.getRandomValue(cardLibrary.length);
            cards.push(cardLibrary.splice(pos, 1)[0]);
        }
        return cards;
    }
    switchToCardIndex(cardData, cardIndex) {
        console.log(`cardData: ${cardData}`);
        if (Array.isArray(cardData)) {
            cardData.forEach(card => {
                cardIndex[this.switchToCardIndex(card)]++;
            });
            return;
        }
        else {
            return (this.getColor(cardData) * 9 + this.getValue(cardData) - 1);
        }
    }
    switchToCardData(cardIndex) {
        if (Array.isArray(cardIndex)) {
            let fn = (idx) => {
                if (cardIndex[idx] > 0) {
                    for (let j = 0; j < cardIndex[idx]; j++) {
                        cards.push(this.switchToCardData(idx));
                    }
                }
            };
            let cards = [];
            for (let i = 0; i < cardIndex.length; i++) {
                if (i == this.hunIndex)
                    continue;
                fn(i);
            }
            fn(this.hunIndex);
            return cards;
        }
        else {
            if (cardIndex < 27) {
                return ((cardIndex / 9) << 4) | (cardIndex % 9 + 1);
            }
            else {
                return (0x30 | (cardIndex - 27 + 1));
            }
        }
    }
    getCardCnt(cardIndex) {
        let cnt = 0;
        cardIndex.forEach(cardcnt => cnt += cardcnt);
        return cnt;
    }
    getRandCard() {
        return this.cardLibrary[this.getRandomValue(this.cardLibrary.length)];
    }
    addWeave2Index(weaveItem, cardIndex) {
        weaveItem.forEach(item => {
            item.cardData.forEach(card => {
                cardIndex[this.switchToCardIndex(card)]++;
            });
        });
    }
    analyseEatCard(cardIndex, curCard) {
        let idx = this.switchToCardIndex(curCard);
        // 如果是字牌不能吃
        if (idx > 26)
            return define_1.WIK.NULL;
        let res = define_1.WIK.NULL;
        let cardIdx = cardIndex.slice(0);
        cardIdx[idx]++;
        let isExit = (start) => {
            for (let i = start; i < start + 3; i++) {
                if (this.isMagicIndex(i))
                    return false;
                if (this.hunIndex == i)
                    return false;
                if (cardIdx[i] == 0)
                    return false;
            }
            return true;
        };
        // 左吃
        if ((idx % 9) < 7) {
            if (isExit(idx))
                res |= define_1.WIK.LEFT;
        }
        // 右吃
        if ((idx % 9) > 1) {
            if (isExit(idx - 2))
                res |= define_1.WIK.RIGHT;
        }
        // 中吃
        if (0 < (idx % 9) && (idx % 9) < 8) {
            if (isExit(idx - 1))
                res |= define_1.WIK.CENTER;
        }
        return res;
    }
    analysePengCard(cardIndex, curCard) {
        let idx = this.switchToCardIndex(curCard);
        if (this.isMagicIndex(idx))
            return false;
        if (this.hunIndex == idx)
            return false;
        return cardIndex[idx] >= 2;
    }
    analyzeGangCard(cardIndex, weaveItem) {
        let res = [];
        let curCard = 0;
        if (typeof weaveItem === "number") {
            curCard = weaveItem;
            weaveItem = [];
        }
        if (!curCard) {
            if (weaveItem) {
                // 补杠
                weaveItem.forEach(item => {
                    if (item.weaveKind == define_1.WIK.PENG) {
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
                if (this.hunIndex == i)
                    continue;
                if (this.isMagicIndex(i))
                    continue;
                if (cardIndex[i] >= 4) {
                    let card = this.switchToCardData(i);
                    res.push([0, 0, 0, card]);
                }
            }
        }
        else {
            // 明杠
            for (let ii in cardIndex) {
                let i = parseInt(ii);
                if (this.hunIndex == i)
                    continue;
                if (this.isMagicIndex(i))
                    continue;
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
    analyseTingCard(cardIndex, weaveItem) {
        let res = [];
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
    analyseHuCard(cardIndex, weaveItem, isBreak) {
        let res = [];
        let cnt = this.getCardCnt(cardIndex);
        if ((cnt - 1) % 3 != 0) {
            console.warn('analyseHuCard error ' + cnt);
            return res;
        }
        for (let i = 0; i < cardIndex.length; i++) {
            let card = this.switchToCardData(i);
            if (define_1.CHR.NULL != this.analyseChiHu(cardIndex, weaveItem, card)) {
                res.push(card);
                if (isBreak)
                    break;
            }
        }
        return res;
    }
    analyseChiHu(cardIndex, weaveItem, currentCard) {
        // console.log("这里的牌信息：", cardIndex, weaveItem, currentCard);
        let chiHuRight = define_1.CHR.NULL;
        if (currentCard == 0) {
            console.warn('analyseChiHu error currentCard is 0');
            return chiHuRight;
        }
        if (this.hunIndex == INVALID_INDEX) {
            console.warn('analyseChiHu error hunIndex is INVALID_INDEX');
            return chiHuRight;
        }
        let cardIdx = cardIndex.slice(0);
        cardIdx[this.switchToCardIndex(currentCard)]++;
        let allCardIdx = cardIdx.slice(0);
        this.addWeave2Index(weaveItem, allCardIdx);
        if (!this.isOpen(weaveItem))
            return chiHuRight;
        if (allCardIdx[this.hunIndex] != 0)
            return chiHuRight;
        if (!this.check19(allCardIdx))
            return chiHuRight;
        if (allCardIdx[HONG_ZHONG_INDEX] == 0 && this.colorCnt(allCardIdx) == 2)
            return chiHuRight;
        let res = this.analyseCard(cardIdx, weaveItem);
        if (res.length == 0)
            return chiHuRight;
        if (!this.checkPeng(res))
            return chiHuRight;
        let jia = this.isChunJiaOrBaiJia(res, currentCard);
        if (this.isPiao(res)) {
            chiHuRight |= define_1.CHR.PIAO;
        }
        else if (jia == 2) {
            chiHuRight |= define_1.CHR.CHUN_JIA;
        }
        else if (jia == 1) {
            chiHuRight |= define_1.CHR.BAI_JIA;
        }
        else if (this.isDuiDao(res, currentCard)) {
            chiHuRight |= define_1.CHR.DUI_DAO;
        }
        else {
            chiHuRight |= define_1.CHR.PI;
        }
        if (this.getCardCnt(cardIdx) == 2) {
            chiHuRight |= define_1.CHR.BA_1;
        }
        if (this.colorCnt(allCardIdx) == 1) {
            chiHuRight |= define_1.CHR.QING_YI_SE;
        }
        if (this.isDuMen(allCardIdx, currentCard)) {
            chiHuRight |= define_1.CHR.DU_MEN;
        }
        return chiHuRight;
    }
    isOpen(weaveItem) {
        for (let item of weaveItem) {
            if (item.public)
                return true;
        }
        return false;
    }
    check19(cardIndex) {
        let yaoIndex = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
        for (let idx of yaoIndex) {
            if (cardIndex[idx] > 0)
                return true;
        }
        return false;
    }
    // 检查是否有暗刻或者碰
    checkPeng(res) {
        for (let item of res) {
            for (let kind of item.weaveKind) {
                if (kind == define_1.WIK.PENG || kind == define_1.WIK.GANG)
                    return true;
            }
        }
        return false;
    }
    /**
     *  获取花色的数量
     * @param cardIndex
     */
    colorCnt(cardIndex) {
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
    isPiao(results) {
        for (let res of results) {
            let isPiao = true;
            for (let kind of res.weaveKind) {
                if (kind != define_1.WIK.PENG && kind != define_1.WIK.GANG) {
                    isPiao = false;
                    break;
                }
                ;
            }
            if (isPiao)
                return true;
        }
        return false;
    }
    //2:纯夹 1:摆夹 0:啥也不是
    isChunJiaOrBaiJia(results, curCard) {
        for (let res of results) {
            let card = 0;
            for (let i = 0; i < MAX_WEAVE; i++) {
                let condition37 = (this.getValue(curCard) == 3 && curCard == res.cardData[i][2]) ||
                    (this.getValue(curCard) == 7 && curCard == res.cardData[i][0]);
                if (res.weaveKind[i] == define_1.WIK.LEFT && res.public[i] == false) {
                    if (curCard == res.cardData[i][1]) {
                        card = res.cardData[i][1];
                        break;
                    }
                    if (this._hasRule(define_1.RULE.JIA_37) && condition37) {
                        card = res.cardData[i][1];
                        break;
                    }
                }
            }
            if (card) {
                if (res.cardEye == card)
                    return 1;
                for (let i = 0; i < MAX_WEAVE; i++) {
                    if (res.weaveKind[i] == define_1.WIK.PENG && res.centerCard[i] == card && res.public[i])
                        return 1;
                }
                return 2;
            }
        }
        return 0;
    }
    isDuiDao(results, curCard) {
        for (let res of results) {
            for (let i = 0; i < MAX_WEAVE; i++) {
                if (res.weaveKind[i] == define_1.WIK.PENG && res.centerCard[i] == curCard)
                    return true;
            }
        }
        return false;
    }
    isDuMen(cardIndex, curCard) {
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
    analyseCard(cardIndex, weaveItem, all) {
        let result = [];
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
        let pushWeaveItem = (res) => {
            if (!res.cardData)
                res.cardData = [];
            if (!res.centerCard)
                res.centerCard = [];
            if (!res.weaveKind)
                res.weaveKind = [];
            if (!res.public)
                res.public = [];
            for (let i in weaveItem) {
                res.cardData[i] = weaveItem[i].cardData;
                res.centerCard[i] = weaveItem[i].centerCard;
                res.weaveKind[i] = weaveItem[i].weaveKind;
                res.public[i] = true;
            }
        };
        // 返回碰kindItem
        let pengKind = (cnt, idx) => {
            let index;
            if (cnt > 2)
                index = [idx, idx, idx];
            else if (cnt > 1)
                index = [idx, idx];
            else
                index = [idx];
            return {
                weaveKind: define_1.WIK.PENG,
                centerCard: this.switchToCardData(idx),
                cardIndex: index,
                magicCnt: 3 - index.length
            };
        };
        // callback排列组合的, callback 返回值可以跳出循环, 神代码, 我是没看懂, 有大神看懂了给我讲讲,
        // eg setIndex(2, 3, call) call([0,1]) call([0,2]) call([1,2]) 
        let setIndex = (subCnt, allCnt, callback) => {
            let index = [];
            for (let i = 0; i < subCnt; i++) {
                index.push(i);
            }
            do {
                if (callback(index))
                    break;
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
                }
                else
                    index[subCnt - 1]++;
            } while (true);
        };
        if (cardCnt == 2) {
            for (var i in cardIndex) {
                // 如果手中两张牌相同或者一张会牌一张非会牌则胡牌
                if (cardIndex[i] == 2 || (cardIndex[i] == 1 && magicCnt == 1)) {
                    let res = {
                        cardEye: this.switchToCardData(parseInt(i)),
                        magicEye: magicCnt > 0,
                    };
                    pushWeaveItem(res);
                    result.push(res);
                    return result;
                }
            }
            return result;
        }
        else {
            // 将所有暗刻牌和连牌组合可能找出 放入kinds中
            let kinds = [];
            let lessKindCnt = (cardCnt - 2) / 3;
            for (let ii in cardIndex) {
                let i = parseInt(ii);
                if (this.isMagicIndex(i))
                    continue;
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
                        if (tempCardCnt == 0)
                            break;
                    } while (tempCardCnt + magicCnt >= 3);
                }
                // 连牌判断
                // 3 * 9 - 2 = 25
                if (i < 25 && (i % 9) < 7) {
                    if (cardIndex[i] + cardIndex[i + 1] + cardIndex[i + 2] + magicCnt >= 3) {
                        let index = [cardIndex[i], cardIndex[i + 1], cardIndex[i + 2]];
                        let cnt = index[0] + index[1] + index[2];
                        // 当连牌中只有一张不处理, 因为可以组成暗刻牌
                        if (cnt == 0 || (cnt == 1 && !all))
                            continue;
                        let tempMagicCnt = magicCnt;
                        while (tempMagicCnt + index[0] + index[1] + index[2] >= 3) {
                            let useIndex = [];
                            for (let j = 0; j < 3; j++) {
                                if (index[j] > 0) {
                                    index[j]--;
                                    useIndex.push(i + j);
                                }
                                else {
                                    tempMagicCnt--;
                                }
                            }
                            if (tempMagicCnt >= 0) {
                                kinds.push({
                                    weaveKind: define_1.WIK.LEFT,
                                    centerCard: this.switchToCardData(i),
                                    cardIndex: useIndex,
                                    magicCnt: 3 - useIndex.length
                                });
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            }
            if (lessKindCnt > kinds.length)
                return result;
            // 找出和当前手牌一致的组合
            setIndex(lessKindCnt, kinds.length, (index) => {
                let tempMagicCnt = 0;
                index.forEach(idx => {
                    tempMagicCnt += kinds[idx].magicCnt;
                });
                // 会牌校验
                if (tempMagicCnt > magicCnt || magicCnt - tempMagicCnt >= 2)
                    return false;
                let tempCardIdx = cardIndex.slice(0);
                for (let idx of index) {
                    for (let idxCard of kinds[idx].cardIndex) {
                        if (tempCardIdx[idxCard] == 0)
                            return false;
                        else
                            tempCardIdx[idxCard]--;
                    }
                }
                if (this.getCardCnt(tempCardIdx) != 2)
                    return false;
                let leftMagicCnt = this.getMagicCnt(tempCardIdx);
                for (let ii in tempCardIdx) {
                    let i = parseInt(ii);
                    if (this.isMagicIndex(i))
                        continue;
                    if (tempCardIdx[i] == 2 || (tempCardIdx[i] == 1 && leftMagicCnt == 1)) {
                        let res = {
                            cardEye: this.switchToCardData(i),
                            magicEye: tempCardIdx[i] == 1
                        };
                        pushWeaveItem(res);
                        index.forEach(idx => {
                            let resIndex = res.centerCard.length;
                            kinds[idx].cardIndex.forEach(idx => {
                                if (!res.cardData[resIndex])
                                    res.cardData[resIndex] = [];
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
            });
        }
        return result;
    }
    getWeaveCard(weaveKind, centerCard) {
        switch (weaveKind) {
            case define_1.WIK.LEFT: return [centerCard, centerCard + 1, centerCard + 2];
            case define_1.WIK.CENTER: return [centerCard - 1, centerCard, centerCard + 1];
            case define_1.WIK.RIGHT: return [centerCard - 2, centerCard - 1, centerCard];
            case define_1.WIK.PENG: return [centerCard, centerCard, centerCard];
            case define_1.WIK.GANG: return [centerCard, centerCard, centerCard, centerCard];
            default: {
                console.warn('getWeaveCard error ' + weaveKind);
                return [];
            }
        }
    }
    getMagicCnt(cardIndex) {
        let cnt = 0;
        this.magicIndex.forEach(idx => {
            if (cardIndex[idx]) {
                cnt + cardIndex[idx];
            }
        });
        return cnt;
    }
    isMagicIndex(idx) {
        for (let index of this.magicIndex) {
            if (index == idx)
                return true;
        }
        return false;
    }
}
exports.GameLogic = GameLogic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUxvZ2ljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vYXBwL2dhbWUvNTIyMDAvZ2FtZUxvZ2ljLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUFzRDtBQW9CdEQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekIsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQztBQUN4QixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDcEIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBRXJCLE1BQWEsU0FBUztJQTRCbEI7UUExQkEsVUFBSyxHQUFhLEVBQUUsQ0FBQztRQUVyQixlQUFVLEdBQWEsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFdEQsYUFBUSxHQUFXLGFBQWEsQ0FBQztRQUVqQyxnQkFBVyxHQUFhO1lBQ3BCLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUNwRCxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDcEQsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO1lBQ3BELElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtZQUNwRCxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUks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