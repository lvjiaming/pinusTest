import ActionClass from "../../Common/script/ActionClass";

const { ccclass, property } = cc._decorator;

interface SPENDCARD {
    [key: number]: { gameRule: number[][], serverRule: number[], card: number }[]
}
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
}
var MAX_NUM = 33; // 规则最大32位
@ccclass
export default class CreateRoom extends ActionClass {

    @property({
        displayName: '点击颜色变化'
    })
    readonly m_bChangeColor: boolean = false;
    @property({
        displayName: 'Normal',
        visible() {
            return this.m_bChangeColor;
        }
    })
    normalColor: cc.Color = cc.Color.WHITE;
    @property({
        displayName: 'Pressed',
        visible() {
            return this.m_bChangeColor;
        }
    })
    pressedColor: cc.Color = cc.Color.WHITE;

    m_bClick: boolean = false;

    m_KindID: number = 0;

    onLoad() {
        let toggles = this.$('_rule').getComponentsInChildren(cc.Toggle);
        toggles.forEach(tog => {
            let eventHandler: cc.Component.EventHandler = new cc.Component.EventHandler();
            eventHandler.target = this.node;
            eventHandler.component = 'CreateRoom';
            eventHandler.handler = '_onBtToggle';
            tog.clickEvents.push(eventHandler);
            if (this.m_bChangeColor) {
                tog.node.getChildByName('sign').color = tog.isChecked ? this.pressedColor : this.normalColor;
            }
        });
        // 界面默认显示修正
        this.showKind(this._getKindID());
    }

    private _onBtToggle(event: cc.Component.EventHandler, data: string) {
        this.m_bClick = true;
    }

    //显示游戏勾选
    public showKind(kind: string) {
        this.$('_kind').getChildByName(kind).getComponent(cc.Toggle).check();
        this.$('_rule').children.forEach(child => {
            child.active = child.name == kind;
        });
        this.m_KindID = parseInt(kind);
        // 恢复规则
        this._restoreRules(kind);

    }

    public onBtKind(evnet: cc.Component.EventHandler, data: string) {
        this.showKind(evnet.target.name);
    }


    async _onBtCreate() {
        var route = 'hall.roomHandler.createRoom';
        var rule = this._getRule(this.m_KindID + '');
        var msg: ICreateRoom = {
            UserID: vv.userInfo.UserID,
            ClubKey: 0,
            KindID: this.m_KindID,
            ServerRules: rule.server | SERVER_RULE.CREATE_ROOMCARD | SERVER_RULE.GAME_ROOM,
            GameRules: rule.game
        };
        // 保存规则
        this.m_bClick = true;
        let res = await vv.pinus.request(route, msg);
        if (res.status != 0) {
            this.showAlert(res.msg);
            return;
        }
        vv.roomInfo = res.data;
        cc.director.loadScene(vv.roomInfo.KindID + '');
    }

    // 获取当前显示的KindID
    private _getKindID(): string {
        for (var i in this.$('_rule').children) {
            if (this.$('_rule').children[i].active) {
                return (this.$('_rule').children[i].name);
            }
        }
        this.$('_rule').children[0].active = true;
        return (this.$('_rule').children[0].name);
    }

    // 获取游戏规则
    protected _getRule(kindid: string): { game: number[], server: number } {
        var toggles = this.$('_rule').getChildByName(kindid).getComponentsInChildren(cc.Toggle);
        var ruleG: number[] = [], ruleS: number = 0;
        toggles.forEach(tog => {
            if (tog.isChecked && tog.node.active && tog.node.parent.active) {
                var num = parseInt(tog.node.name);
                if (isNaN(num)) {
                    num = parseInt(tog.node.name.slice(1));
                    if (isNaN(num)) return;
                    ruleS += 1 << num;
                } else {
                    var idx = Math.floor(num / MAX_NUM);
                    if (ruleG[idx] == null) ruleG[idx] = 0;
                    ruleG[idx] += 1 << (num % MAX_NUM);
                }
            }
        });
        return { game: ruleG, server: ruleS };
    }

    // 恢复游戏勾选
    private _restoreRules(kind: string) {
        var rules = cc.sys.localStorage.getItem(`${GAME_NAME}_${kind}_rules`);
        if (rules) {
            try {
                rules = JSON.parse(rules) as { game: number[], server: number };
            } catch (e) {
                console.warn('_restoreRules error!', e, rules);
                return;
            }
        } else {
            return;
        }
        var ruleG = rules.game;
        var ruleS = rules.server;
        var toggles = this.$('_rule').getChildByName(kind).getComponentsInChildren(cc.Toggle);
        toggles.forEach(tog => {
            if (tog.node.active && tog.node.parent.active) {
                var num = parseInt(tog.node.name);
                if (isNaN(num)) {
                    num = parseInt(tog.node.name.slice(1));
                    if (isNaN(num)) return;
                    if ((1 << num) & ruleS) {
                        tog.check();
                    } else {
                        tog.uncheck();
                    }
                } else {
                    if (ruleG[Math.floor(num / MAX_NUM)] & (1 << (num % MAX_NUM))) {
                        tog.check();
                    } else {
                        tog.uncheck();
                    }
                }
            }
            // 恢复完设置颜色
            this.m_bClick = true;
        });
    }

    update(dt) {
        if (this.m_bClick) {
            let toggles = this.$('_rule').getComponentsInChildren(cc.Toggle);
            toggles.forEach(tog => {
                if (this.m_bChangeColor) {
                    tog.node.getChildByName('sign').color = tog.isChecked ? this.pressedColor : this.normalColor;
                }
            });
            this.m_bClick = false;
            let rule = this._getRule(this.m_KindID + '');
            cc.sys.localStorage.setItem(`${GAME_NAME}_${this.m_KindID}_rules`, JSON.stringify(rule));

            // 显示房卡, 如果是俱乐部默认房主支付
            if ((rule.server & SERVER_RULE.PAY_AA) == 0 && (rule.server & SERVER_RULE.PAY_CREATOR) == 0) {
                rule.server |= SERVER_RULE.PAY_CREATOR;
            }
            this.$('_labCard', cc.Label).string = this.getSpend(this.m_KindID, rule.game, rule.server) + '张房卡';
        }
    }


    spendCard: SPENDCARD = {
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
    
    getSpend(kindID: number, gameRules: number[], serverRules: number) {
        let arr = this.spendCard[kindID];
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
}
