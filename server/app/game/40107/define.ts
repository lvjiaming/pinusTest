export var RULE = {
    INNING_10: 1 << 0, // 10局
    INNING_20: 1 << 1, // 20局
    GOOD_CALL: 1 << 2, // 四个二两王必叫
    NO_KICK: 1 << 3, // 不带踢
    FARMER_KICK: 1 << 4, // 农民踢
    ALL_KICK: 1 << 5, // 全踢
    SHOW_CARD: 1 << 6, // 明牌
    NO_345: 1 << 7, // 不带345
    MAX_48: 1 << 8, // 封顶48
    MAX_96: 1 << 9, // 封顶96
    MAX_192: 1 << 10, // 封顶192
    SCORE_100: 1 << 11,
    SCORE_200: 1 << 12
};

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