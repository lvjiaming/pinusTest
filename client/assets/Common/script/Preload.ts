import GameClient_40107 from "../../Game/40107/script/GameClient_40107";
import GameReplay_40107 from "../../Game/40107/script/GameReplay_40107";
import GameClient_52200 from "../../Game/52200/script/GameClient_52200";
import GameReplay_52200 from "../../Game/52200/script/GameReplay_52200";

export default class Preload {

    public m_Prefab: { [key: string]: cc.Prefab } = {};

    public m_HeadDef: cc.SpriteFrame = null;

    public m_UserHeadMap: { [key: number]: cc.SpriteFrame } = {}; //userid -> cc.SpriteFrame

    public m_Sounds: { [key: string]: cc.AudioClip } = {};

    constructor() {
        window['GameClient_52200'] = GameClient_52200;
        window['GameReplay_52200'] = GameReplay_52200;
        window['GameClient_40107'] = GameClient_40107;
        window['GameReplay_40107'] = GameReplay_40107;
        if (cc.sys.isBrowser) {
            cc.director.preloadScene('52200');
            cc.director.preloadScene('40107');
        }
    }

    public async loadPrefab(progressCallback: (completedCount: number, totalCount: number, item: any) => void): Promise<null> {
        return new Promise((resolve, reject) => {
            cc.loader.loadResDir('prefab', cc.Prefab, progressCallback, (err: Error, pre) => {
                if (err) {
                    console.error(err.message || err);
                    resolve();
                    return;
                }
                for (var i in pre) {
                    this.m_Prefab[pre[i].name] = pre[i];
                }
                resolve();
            });
        })
    }

    public async loadPicture(): Promise<null> {
        return new Promise((resolve, reject) => {
            cc.loader.loadRes('picture/FaceDef', cc.SpriteFrame, (err: Error, pre) => {
                if (err) {
                    console.error(err.message || err);
                    resolve();
                    return;
                }
                this.m_HeadDef = pre;
                resolve();
            });
        })
    }

    public async loadSounds(progressCallback: (completedCount: number, totalCount: number, item: any) => void): Promise<null> {
        return new Promise((resolve, reject) => {
            cc.loader.loadResDir('sounds', cc.AudioClip, progressCallback, (err: Error, pre) => {
                if (err) {
                    console.error(err.message || err);
                    resolve();
                    return;
                }
                pre.forEach(chip => this.m_Sounds[chip.name] = chip);
                resolve();
            });
        })
    }
}

