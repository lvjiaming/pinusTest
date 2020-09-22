import ActionClass from "../../Common/script/ActionClass";
import ThirdParty from "../../Common/script/ThirdParty";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ShareDlg extends ActionClass {

    private shareInfo = {
        title: '乐友宝清',
        desc: '超好玩的游戏！',
        link: SHARE_URL
    };

    _onBtLine () {
        if (cc.sys.isNative) {
            ThirdParty.WXShareUrl(this.shareInfo, true);
        } else {
            this.showPrefab('ShareTips');
        }
    }

    _onBtFriend () {
        if (cc.sys.isNative) {
            ThirdParty.WXShareUrl(this.shareInfo, false);
        } else {
            this.showPrefab('ShareTips');
        }
    }
}
