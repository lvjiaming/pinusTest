import ActionClass from "../../Common/script/ActionClass";
import UserCtrl from "../../Common/script/UserCtrl";
import ClubMember from "./ClubMember";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ClubUser extends ActionClass {
    
    userID: number = 0;

    m_Hook: ClubMember;

    setView(userID: number, score: string) {
        this.userID = userID;
        this.$('_userInfo', UserCtrl).setUserByID(userID);
        this.$('_labMyScore', cc.Label).string = vv.club.userInfo.Score + '';
        this.$('_labScore', cc.Label).string = score;
    }

    async _onBtKick() {
        if (this.userID == vv.userInfo.UserID) {
            this.showAlert('您不能踢出自己');
            return;
        }
        this.showAlert('确定要踢出该玩家吗?', Alert.YesNo, async (result) => {
            if (!result) return;
            let route = 'club.clubHandler.kickUser';
            let res = await vv.pinus.request(route, {
                userID: this.userID
            });
            if (res.status != 0) {
                this.m_Hook.showAlert(res.msg);
            } else {
                this.m_Hook.showAlert('操作成功');
                this.node.active = false;
            }
            this.m_Hook._setView(res.data);
        })
    }

    _onBtAdd() {
        let score = parseInt(this.$('_editScore', cc.EditBox).string);
        this._sendAdd(score)
    }

    _onBtSub() {
        let score = parseInt(this.$('_editScore', cc.EditBox).string);
        this._sendAdd(-score)
    }

    _onBtClear() {
        this._sendAdd(0)
    }

    async _sendAdd(score: number) {
        if (isNaN(score)) {
            this.showTips('请输入正确的数字');
            return;
        }

        if (-score > parseInt(this.$('_labScore', cc.Label).string)) {
            this.showTips('您的填写体力值太大了');
            return;
        }

        let ret = await vv.pinus.request('club.clubHandler.addScore', {
            userID: this.userID,
            score: score
        });
        if (ret.status != 0) {
            this.showAlert(ret.msg);
            return;
        }
        this.showAlert('操作成功');
        let data: {userInfo: IClubUserInfo, tagUser: IClubUserInfo} = ret.data;
        vv.club.userInfo = data.userInfo;
        this.$('_labMyScore', cc.Label).string = vv.club.userInfo.Score + '';
        this.$('_labScore', cc.Label).string = data.tagUser.Score + '';
        this.m_Hook.updateUser(data.tagUser.UserID, data.tagUser.Score);
    }

    
}
