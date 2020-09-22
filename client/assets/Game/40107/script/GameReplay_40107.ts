import GameReplay from "../../Public/script/GameReplay";
import { ReplayCustom } from './../../Public/script/GameReplay';
import GameClient_40107, { IBankInfo } from "./GameClient_40107";
import GameView_40107 from "./GameView_40107";

export default class GameReplay_40107 implements ReplayCustom {

    gameClient: GameClient_40107;
    gameView: GameView_40107;
    gameReplay: GameReplay;

    // 瞬时动作 自动播放不需要等待, 注意第一条动作不能为瞬时动作
    instant: string[] = [
        'onBankScore',
        'onUpdateHandCnt',
        'onUpdateCard',
        'onOpCall',
        'onOpKick',
        'onOpShow',
        'onOutCard',
        'onOpOut',
        // 'onCurrentUser',
        'onUpdateTimes',
        'onSureBank',
    ];

    // 不需要处理的消息体
    except: string[] = [
        'onChat'
    ]

    constructor(gameReplay, gameClient) {
        this.gameClient = gameClient;
        this.gameView = this.gameClient.gameView;
        this.gameReplay = gameReplay;
    }

    // 特殊处理的消息
    onGameStart(chair: number, data: { handCard: number[], currentUser: number, bankInfo: IBankInfo }) {
        let view = this.gameClient.chair2View(chair);
        this.gameView.handCtrl[view].cardCtrl.cards = data.handCard;
        this.gameView.handCtrl[view].node.active = true;
        if (data.currentUser == this.gameClient.meChairID) {
            this.gameView.operateCtrl.onOpCall(data.bankInfo);
        }
        this.gameView.gameHead.forEach(js => js.onCurrentUser({ chair: data.currentUser }));
    }

    onUpdateCard(chair: number, data: { chair: number, cards: number[] }) {
        let view = this.gameClient.chair2View(data.chair);
        this.gameView.handCtrl[view].cardCtrl.cards = data.cards;
    }


    public onGameConclude(chair: number, data: any) {
        window["pomelo"].emit('onGameConclude', data);
        let alert = this.gameView.m_loadPrefab['GameAlert'];
        if (alert && alert.active) {
            alert.active = false;
        }
    }
}
