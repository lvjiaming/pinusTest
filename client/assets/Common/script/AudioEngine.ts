

export default class AudioEngine {

    constructor() {
        let value = cc.sys.localStorage.getItem(GAME_NAME + '_musicValue');
        if (value) {
            cc.audioEngine.setMusicVolume(parseFloat(value));
        }
        let valueEffect = cc.sys.localStorage.getItem(GAME_NAME + '_effectValue');
        if (valueEffect) {
            cc.audioEngine.setEffectsVolume(parseFloat(valueEffect));
        }
    }

    playMusic (name: string) {
        let chip = vv.preload.m_Sounds[name];
        if (!chip) {
            console.log(name + '音乐没有找到!');
            return;
        }
        cc.audioEngine.playMusic(chip, true);
    }

    playEffect (name: string) {
        // 回放回退不播语音
        if (vv.replay && vv.replay.isReturn) return;
        let chip = vv.preload.m_Sounds[name];
        if (!chip) {
            console.log(name + '音效没有找到!');
            return;
        }
        cc.audioEngine.playEffect(chip, false);
    }

    setMusicVolume (value: number) {
        cc.audioEngine.setMusicVolume(value);
        cc.sys.localStorage.setItem(GAME_NAME + '_musicValue', value + '');
    }

    setEffectVolume (value: number) {
        cc.audioEngine.setEffectsVolume(value);
        cc.sys.localStorage.setItem(GAME_NAME + '_effectValue', value + '');
    }
}
