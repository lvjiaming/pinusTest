import GameReplay from "../../Public/script/GameReplay";
import { IHandCard } from './../../Mahjong/script/HandCtrl';
import { TYPE } from './../../Mahjong/script/MJCard';
import { ReplayCustom } from './../../Public/script/GameReplay';
import GameClient_52200 from "./GameClient_52200";
import GameView_52200 from "./GameView_52200";

export default class GameReplay_52200 implements ReplayCustom {

    gameClient: GameClient_52200;
    gameView: GameView_52200;
    gameReplay: GameReplay;

    // 瞬时动作 自动播放不需要等待, 注意第一条动作不能为瞬时动作
    instant: string[] = [
        'onHandCard',
        'onUpdateLeftCnt',
        'onBaseCard',
        'onUserCanOut',
        'onUpdateProcess',
        'onOperateNotice',
        'onUserListen',
        // 'onGameStart'
    ];

    // 不需要处理的消息体
    except: string[] = [
        'onUserCanOut',
        'onChat'
    ]

    constructor(gameReplay, gameClient) {
        this.gameClient = gameClient;
        this.gameView = this.gameClient.gameView;
        this.gameReplay = gameReplay;
    }

    // 特殊处理的消息
    public onHandCard(chair: number, data: IHandCard) {
        if (chair == -1) return;
        let view = this.gameClient.chair2View(chair);
        let js = this.gameView.handCtrl[view];
        js.setCards(data.handCard, data.currentCard);
        let scale = this.gameClient.lieScale[view];
        js.allCards.forEach((card) => {
            card.type = TYPE.LIE;
            card.scale = scale
        });
    }
    
    public onGameConclude(chair: number, data: any) {
        window["pomelo"].emit('onGameConclude', data);
        let alert = this.gameView.m_loadPrefab['GameAlert'];
        if (alert && alert.active) {
            alert.active = false;
        }
    }
}
