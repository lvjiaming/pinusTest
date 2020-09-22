import BaseClass from "../../../Common/script/BaseClass";
import ThirdParty from "../../../Common/script/ThirdParty";
import DissGame from "./DissGame";
import GameView from "./GameView";
import WeChatH5 from "../../../Common/script/WeChatH5";

const { ccclass, property } = cc._decorator;

export enum UserState {
    FREE = 0,
    PALYING
}

export enum GameState {
    SCENE_FREE = 0,
    SCENE_PLAYING
}

export var MYSELF_VIEW_ID = 0;

export var GAME_PLAYER = 4;

export const INVALID_CHAIR = -1;

@ccclass
export default class GameClient extends BaseClass {

    // LIFE-CYCLE CALLBACKS:
    m_bOpen: boolean = false;

    roomInfo: IRoomInfo = null;

    sitUser: ITableUser[] = [];

    gameView: GameView = null;

    meUser: ITableUser | ILookonUser = null;

    meChairID: number = INVALID_CHAIR;

    process: number = 0;

    bigEndData: any = null;

    voiceBuffer: IChatInfo[] = [];

    isPlaying: boolean = false;

    static updateGPSTimes: number = 0;

    onLoad() {
        this.node.scaleY = cc.view.getVisibleSize().height / SCENE_HEIGHT;
        (<any>window).g_CurScence = this;
        vv.gameClient = this;
        this.on(['onErrMsg', 'onEnterUser', 'onRoomInfo', 'onUpdateProcess', 'onLeaveUser', 'onDissRoomApply', 'onChat']);
        if (vv.replay == null) {
            this.enter();
        }
        this.gameView = this.node.getComponent(GameView);
    }

    enter() {
        var route = 'game.gameHandler.enter';
        vv.roomInfo.GPSInfo = vv.gps;
        vv.pinus.notify(route, vv.roomInfo);
    }

    onDestroy() {
        super.onDestroy();
        vv.gameClient = null;
        g_CurScence = null;
    }

    //////////////////////////////////////////////////////////////// 消息函数
    onErrMsg(res: IResponse) {
        if (res.status != 0) {
            this.showAlert(res.msg, Alert.Yes, () => {
                cc.director.loadScene('Hall');
            });
        } else {
            this.showAlert(res.msg);
        }
    }

    onRoomInfo(info: IRoomInfo) {
        this.roomInfo = info;
        this.gameView.setRoomView(info, this);
        this.onUpdateProcess(info.Process);
        vv.audio.playMusic('bgm' + info.KindID);

        if (cc.sys.isBrowser) {
            let share = {
                desc: window['GameClient_' + this.roomInfo.KindID].getRuleStr(
                    this.roomInfo.GameRules, this.roomInfo.ServerRules),
                title: `【房间号:${this.roomInfo.RoomID}】`,
                data: JSON.stringify({
                    roomID: this.roomInfo.RoomID
                })
            };
            WeChatH5.setShareInfo(share);
        }
    }

    onEnterUser(users: ITableUser[]) {
        if (!this.gameView) return;
        users.forEach(user => {
            if (null == user) return;
            user.UserInfo.NickName = decodeURI(user.UserInfo.NickName);
            this.sitUser[user.ChairID] = user;
            if (user.UserInfo.UserID == vv.userInfo.UserID) {
                this.meUser = user;
                this.meChairID = user.ChairID;
            }
            this.gameView.onEnterUser(user);
        });
    }

    onLeaveUser(userID: number): void {
        if (vv.userInfo.UserID == userID) {
            cc.director.loadScene('Hall');
            return;
        }
        for (var i in this.sitUser) {
            if (this.sitUser[i].UserInfo.UserID == userID) {
                delete this.sitUser[i];
            }
        }
    }

    onUpdateProcess(process: number) {
        this.process = process;
        this.roomInfo.Process = process;
        this.gameView.onUpdateProcess(process);
        ThirdParty.getGPSInfo();
        GameClient.updateGPSTimes = 0;
    }

    async onDissRoomApply(data) {
        let js = await this.gameView.showPrefab<DissGame>('DissGame');
        js.setView(data)
    }

    dissGame() {
        if (this.process > 0 || (this.roomInfo.CreatorID == vv.userInfo.UserID && this.roomInfo.ClubKey == 0)) {
            this.showAlert('确定要解散房间?', Alert.YesNo, res => {
                if (res) {
                    this.sendFrame('dissRoom', {});
                }
            })
        } else {
            this.showAlert('确定要退出房间?', Alert.YesNo, res => {
                if (res) {
                    this.sendFrame('userLeave', {});
                }
            })
        }
    }

    public sendFrame(route: string, data: any) {
        vv.pinus.notify('game.gameHandler.onFrameMsg', {
            route: route,
            data: data
        } as IGameMsg);
    }

    public sendGame(route: string, data: any) {
        vv.pinus.notify('game.gameHandler.onGameMsg', {
            route: route,
            data: data
        } as IGameMsg);
    }


    public chair2View(chairID: number | string): number {
        if (typeof chairID === "string") chairID = parseInt(chairID);
        if (chairID == INVALID_CHAIR) return INVALID_CHAIR;
        return ((chairID + this.getMaxPlayer() - this.meChairID) + MYSELF_VIEW_ID) % this.getMaxPlayer();
    }

    getMaxPlayer() {
        return 1;
    }

    getTotalInning(): number {
        return 0;
    }

    public view2Chair(viewID: number | string): number {
        if (typeof viewID === "string") viewID = parseInt(viewID);
        return ((viewID + this.getMaxPlayer() - MYSELF_VIEW_ID) + this.meChairID) % this.getMaxPlayer();
    }

    public static getRuleStr(gameRules: number[], serverRules: number) {
        return '';
    }


    public onChat(data: IChatInfo) {
        if (data.sign == 3 && data.msg != undefined) {
            this.voiceBuffer.push(data);
            if (this.isPlaying) return;
            this.onPlayFinish();
        }
        if (data.sign == 4) {
            this.gameView.playMagicEmoji(this.chair2View(data.chairID), this.chair2View(data.toChair), parseInt(data.msg));
        }
    }

    public onPlayFinish() {
        console.log('onPlayFinish');
        if (this.voiceBuffer.length > 0) {
            let data = this.voiceBuffer.shift();
            if (!this.isPlaying) {
                this.isPlaying = true;
                cc.audioEngine.pauseAll();
            }
            this.gameView.gameHead.forEach(js => js.$('_play').active = false);
            this.gameView.gameHead[this.chair2View(data.chairID)].$('_play').active = true;
            console.log(data.msg);
            ThirdParty.playVoice(data.msg);
        } else {
            this.isPlaying = false;
            cc.audioEngine.resumeAll();
            this.gameView.gameHead.forEach(js => js.$('_play').active = false);
        }
    }

    onRecordFinish(str: string) {
        vv.gameClient.sendFrame('onChat', {
            sign: 3,
            msg: str
        });
    }

    // 1男2女0未知
    getGender(chairID: number): string {
        let gender = 0;
        if (this.sitUser[chairID]) {
            gender = this.sitUser[chairID].UserInfo.Gender;
        }
        if (gender == 1) return 'm';
        else return 'w';
    }



    // update (dt) {}
}