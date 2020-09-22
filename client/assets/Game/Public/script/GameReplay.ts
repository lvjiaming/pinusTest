import BaseClass from "../../../Common/script/BaseClass";
import GameClient from "./GameClient";

const { ccclass, property } = cc._decorator;

export interface ReplayCustom {
    instant: string[];
    except: string[];
}

interface Data {
    chair: number;
    route: string;
    info: any;
}

interface ReplayData {
    chair: number;
    route: string;
    info: any;
    next: Data[];
}


@ccclass
export default class GameReplay extends BaseClass {

    m_Hook: GameClient;

    index: number = 0;

    replay: ReplayCustom = null;

    video: ReplayData[] = [];

    drawIDs: number[] = [];

    curDrawID: number = 0;

    videoData: string = '';

    get isRun(): boolean {
        return this.$('_btStop').active;
    }
    set isRun(value: boolean) {
        this.$('_btPlay').active = !value;
        this.$('_btStop').active = value;
    }

    onLoad() {
        this.node.zIndex = 101;
        this.on(['onReplayData']);
    }

    async setView(cur: number, drawIDs?: number[]) {
        this.curDrawID = cur;
        if (drawIDs) this.drawIDs = drawIDs;
        this.m_Hook.onRoomInfo(vv.replay.roomInfo);
        let first = null;
        vv.replay.sitUser.forEach(user => {
            if (user == null) return;
            if (user.UserInfo.UserID == vv.userInfo.UserID) {
                this.m_Hook.meChairID = user.ChairID;
                this.m_Hook.meUser = user;
            }
            if (first == null) first = user;
        });
        // 如果自己不再此游戏中设置自己为第一个人
        if (this.m_Hook.meUser == null) {
            this.m_Hook.meChairID = first.ChairID;
            this.m_Hook.meUser = first;
        }
        this.m_Hook.onEnterUser(vv.replay.sitUser);
        this.resetView();
        this.replay = new window['GameReplay_' + vv.replay.roomInfo.KindID](this, this.m_Hook);
        this.video = [];
        this._processData();
        this.index = 0;
        this.$('_labProcess', cc.Label).string = this.index + '/' + this.video.length;
        this.$('_btLastGame', cc.Button).interactable = this.drawIDs.indexOf(this.curDrawID) != 0;
        this.$('_btNextGame', cc.Button).interactable = this.drawIDs.indexOf(this.curDrawID) != this.drawIDs.length - 1;
    }

    _processData() {
        let idx = 0;
        vv.replay.gameData.forEach(data => {
            if (this.replay) {
                // 过滤掉不需要处理的动作
                if (this.replay.except && this.replay.except.length > 0 && this.replay.except.indexOf(data.route) > -1) return;
                // 不是发给自己消息也没有特殊处理需要过滤掉
                if (this.m_Hook.meChairID != data.chair && data.chair != -1 && this.replay[data.route] == null) return;
                // 将瞬时动作挂到前一条数据上
                if (this.replay.instant && this.replay.instant.length > 0 && this.replay.instant.indexOf(data.route) > -1) {
                    if (this.video[idx - 1]) {
                        this.video[idx - 1].next.push(data);
                    } else {
                        console.log('前一条没有数据', this.video, idx);
                    }
                    return;
                }
            } else {
                // 过滤掉不是发给自己的消息
                if (this.m_Hook.meChairID != data.chair && data.chair != -1) return;
            }
            this.video[idx++] = {
                chair: data.chair,
                route: data.route,
                info: data.info,
                next: []
            };
        })
    }

    _onBtReturn() {
        vv.replay = null;
        cc.director.loadScene('Hall');
    }

    _onBtPlay() {
        this.isRun = true;
        this._play();
    }

    _onBtStop() {
        this.isRun = false;
    }

    _onBtNext() {
        this.isRun = false;
        this._play(true);
    }

    _onBtLastGame() {
        let index = this.drawIDs.indexOf(this.curDrawID);
        if (index > 0) {
            this._getVideo(this.drawIDs[index - 1])
        }
    }

    _onBtNextGame() {
        let index = this.drawIDs.indexOf(this.curDrawID);
        if (index + 1 < this.drawIDs.length) {
            this._getVideo(this.drawIDs[index + 1])
        }
    }

    async _getVideo(drawID: number) {
        let route = 'hall.hallHandler.getReplay';
        this.videoData = '';
        vv.pinus.notify(route, { drawID: drawID });
    }

    onReplayData(data) {
        if (typeof data == 'object') {
            if (data.status != 0) {
                this.showAlert(data.msg);
            } else {
                vv.replay = JSON.parse(this.videoData);
                this.setView(data.data.drawID);
            }
        } else {
            this.videoData += data;
        }
    }

    _onBtLast() {
        if (this.index - 1 < 0) return;
        this.isRun = false;
        vv.replay.isReturn = true;
        this.resetView();
        let times = this.index - 1;
        this.index = 0;
        for (let i = 0; i < times; i++) {
            this._play(true);
        }
        vv.replay.isReturn = false;
        this.$('_labProcess', cc.Label).string = this.index + '/' + this.video.length;
    }

    _play(force?: boolean) {
        if (!this.isRun && force == null) return;
        if (this.index == this.video.length) return;
        let data = this.video[this.index++];
        this.$('_labProcess', cc.Label).string = this.index + '/' + this.video.length;
        this._playData(data);
        if (data.next.length > 0) {
            data.next.forEach(info => this._playData(info));
        }
        if (this.isRun) {
            this.scheduleOnce(this._play.bind(this), 1);
        }
    }

    _playData(data: { chair: number, route: string, info: any }) {
        if (data == null) return;
        // 调用自定义回放处理
        if (this.replay && this.replay[data.route]) {
            if (LOG_NET) console.log('%c recive:', 'color:#f00;', data.route, data.info);
            this.replay[data.route](data.chair, data.info);
        } else {
            window["pomelo"].emit(data.route, data.info);
        }
    }

    resetView() {
        this.m_Hook.gameView.resetView();
        let diss = this.m_Hook.gameView.m_loadPrefab['DissGame'];
        if (diss && diss.active) {
            diss.active = false;
        }
        let alert = this.m_Hook.gameView.m_loadPrefab['GameAlert'];
        if (alert && alert.active) {
            alert.active = false;
        }
    }
}
