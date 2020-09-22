"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHR = exports.WIK = exports.DEF = exports.RULE = void 0;
exports.RULE = {
    PLAYER_2: (1 << 0),
    PLAYER_3: (1 << 1),
    PLAYER_4: (1 << 2),
    INNING_20: (1 << 3),
    INNING_30: (1 << 4),
    SCORE_100: (1 << 5),
    SCORE_200: (1 << 6),
    FIRE_PAY_3: (1 << 7),
    FIRE_3_PAY: (1 << 8),
    JIA_37: (1 << 9),
    TEAR: (1 << 10),
    SEA_MOON: (1 << 11),
};
;
exports.DEF = {
    KIND_ID: 52200,
};
// 动作掩码
exports.WIK = {
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
exports.CHR = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vYXBwL2dhbWUvNTIyMDAvZGVmaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdXLFFBQUEsSUFBSSxHQUFHO0lBQ2QsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQixRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xCLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQixTQUFTLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25CLFNBQVMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkIsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQixVQUFVLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BCLFVBQVUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEIsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2YsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUN0QixDQUFDO0FBVUQsQ0FBQztBQUVTLFFBQUEsR0FBRyxHQUFHO0lBQ2IsT0FBTyxFQUFFLEtBQUs7Q0FDakIsQ0FBQztBQUVGLE9BQU87QUFDSSxRQUFBLEdBQUcsR0FBRztJQUNiLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBSSxFQUFFLE1BQU07SUFDWixNQUFNLEVBQUUsTUFBTTtJQUNkLEtBQUssRUFBRSxNQUFNO0lBQ2IsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFJLEVBQUUsTUFBTTtJQUNaLE1BQU0sRUFBRSxNQUFNO0lBQ2QsTUFBTSxFQUFFLE1BQU07Q0FDakIsQ0FBQztBQUVGLE9BQU87QUFDSSxRQUFBLEdBQUcsR0FBRztJQUNiLElBQUksRUFBRSxVQUFVO0lBQ2hCLEVBQUUsRUFBRSxVQUFVO0lBQ2QsSUFBSSxFQUFFLFVBQVU7SUFDaEIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsSUFBSSxFQUFFLFVBQVU7SUFDaEIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsTUFBTSxFQUFFLFVBQVU7SUFDbEIsT0FBTyxFQUFFLFVBQVU7Q0FDdEIsQ0FBQyJ9