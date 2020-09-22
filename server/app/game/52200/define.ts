


export var RULE = {
    PLAYER_2: (1 << 0), //0 二人
    PLAYER_3: (1 << 1), //1 三人
    PLAYER_4: (1 << 2), //2 四人
    INNING_20: (1 << 3), //3 20局
    INNING_30: (1 << 4), //4 30局
    SCORE_100: (1 << 5), //5 100底分
    SCORE_200: (1 << 6), //6 200底分
    FIRE_PAY_3: (1 << 7), //7 点炮包三家
    FIRE_3_PAY: (1 << 8), //8 点炮三家付
    JIA_37: (1 << 9), //9 37夹
    TEAR: (1 << 10), //10 流泪
    SEA_MOON: (1 << 11), //11 海底捞月
};

export interface IWeaveItem {
    weaveKind: number;
    centerCard: number;
    public: boolean;
    provider: number;
    cardData: number[];
    // 特殊 当开门时暗杠需要给其他人看到
    show: boolean;
};

export var DEF = {
    KIND_ID: 52200,
};

// 动作掩码
export var WIK = {
    NULL: 0x0000,
    LEFT: 0x0001,
    CENTER: 0x0002,
    RIGHT: 0x0004,
    PENG: 0x0008,
    GANG: 0x0010,
    LISTEN: 0x0020,
    CHI_HU: 0x0040,
};

// 胡牌权位
export var CHR = {
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
};