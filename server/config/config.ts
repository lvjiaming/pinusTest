export var options = {
    connectionLimit: 10,
    host: "localhost",
    port: "3306",
    database: "csgame",
    user: "root",
    password: "123456",
    charset: 'utf8mb4',
    multipleStatements: true //可执行多条语句
};

export var ip = '127.0.0.1';
export var inip = '127.0.0.1';
export var httpPort = '3000';
export var LEFTONE = false;
export var WXID = 'wx2eaf0e93ba0300a5';
export var WXSECRET = 'b51e77038b8ad83e3f974576d913ac14';

export var SERVER_RULE = {
    //积分 0
    TPPE_SCORE: Math.pow(2, 0),
    //金币 1
    TPPE_GOLD: Math.pow(2, 1),
    //俱乐部积分 2
    TPPE_CLUB_SCORE: Math.pow(2, 2),
    //开局消耗房卡 3
    CREATE_ROOMCARD: Math.pow(2, 3),
    //开局消耗金币 4
    CREATE_GOLD: Math.pow(2, 4),
    //房主支付 5
    PAY_CREATOR: Math.pow(2, 5),
    //AA支付 6
    PAY_AA: Math.pow(2, 6),
    //大赢家支付 7
    PAY_BIGWIN: Math.pow(2, 7),
    //代开 8
    AGENCY_CREATE: Math.pow(2, 8),
    //匹配场 9
    GAME_MATCH: Math.pow(2, 9),
    //房间场 10
    GAME_ROOM: Math.pow(2, 10),
    //百人场 11
    GAME_100: Math.pow(2, 11),
};


const spendCard: SPENDCARD = {
    52200: [{
        gameRule: [[0]],
        serverRule: [5],
        card: 2
    }, {
        gameRule: [[1]],
        serverRule: [5],
        card: 3
    }, {
        gameRule: [[2]],
        serverRule: [5],
        card: 4
    }, {
        gameRule: [],
        serverRule: [6],
        card: 1
    }],
    40107: [{
        gameRule: [],
        serverRule: [5],
        card: 3
    }, {
        gameRule: [],
        serverRule: [6],
        card: 1
    }]
};

export function getSpend(kindID: number, gameRules: number[], serverRules: number) {
    let arr = spendCard[kindID];
    let card = 0;
    for (let key of arr) {
        let exit: boolean = true;
        for (let i in key.gameRule) {
            let rule = 0;
            key.gameRule[i].forEach(n => rule |= (1 << n));
            if (rule && (rule & gameRules[i]) != rule) {
                exit = false;
                break;
            }
        }
        if (exit) {
            let rule = 0;
            key.serverRule.forEach(n => rule |= (1 << n));
            if (rule && (serverRules & rule) != rule) {
                continue;
            }
            card += key.card;
        }
    }
    return card;
}

interface SPENDCARD {
    [key: number]: { gameRule: number[][], serverRule: number[], card: number }[]
}